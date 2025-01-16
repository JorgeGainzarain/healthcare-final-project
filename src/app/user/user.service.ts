import {Service} from 'typedi';
import {LogService} from '../log/log.service';
import {User, UserType} from './user.model';
import {UserRepository} from './user.repository';
import {BaseService} from "../base/base.service";
import {config} from "../../config/environment";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {StatusError} from "../../utils/status_error";
import {validateObject} from "../../utils/validation";
import {Log} from 'app/log/log.model';
import {Patient} from "../patient/patient.model";
import {Doctor_Private} from "../doctor/doctor.model";
import {Session, SessionData} from "express-session";
import {PatientRepository} from "../patient/patient.repository";
import {DoctorRepository} from "../doctor/doctor.repository";

dotenv.config();

@Service()
export class UserService extends BaseService<User | Patient | Doctor_Private> {
    protected entityConfig = config.entityValues.user;

    constructor(
        protected logService: LogService,
        protected userRepository: UserRepository,

        protected patientRepository: PatientRepository,
        protected doctorRepository: DoctorRepository
    ) {
        super(userRepository, logService);
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    public async register(session: Session & Partial<SessionData>, part_user: Partial<User>): Promise<Omit<User, 'password'>> {
        const userFull = validateObject(part_user, this.entityConfig.requiredFields)

        // Create Patient or Doctor object if user is of type Patient or Doctor
        this.validateUser(userFull);

        // Parse user object only with the required fields
        const user = { username: userFull.username, password: userFull.password, role: userFull.role } as User;

        const saltRounds = 10;
        user.password = await bcrypt.hash(user.password, saltRounds);
        const createdUser = await this.userRepository.create(user);
        const { password, ...userWithoutPassword } = createdUser;

        // Remove password and username fields from the user object
        const { username, role, password: pass, ...userWithoutPasswordAndUser } = { ...userFull, user_id: createdUser.id };

        if (user.role.toUpperCase() === UserType.PATIENT) {
            await this.patientRepository.create({
                ...userWithoutPasswordAndUser,
                user_id: createdUser.id
            } as Patient);
        } else if (user.role.toUpperCase() === UserType.DOCTOR) {
            await this.doctorRepository.create({
                ...userWithoutPasswordAndUser,
                user_id: createdUser.id
            } as Doctor_Private);
        }

        await this.logUserAction({ ...userWithoutPassword } as User , 'registered');
        return userWithoutPassword;
    }

    public async login(part_user: Partial<User>): Promise<{ user: Omit<User, 'password'>, token: string }> {
        const user = validateObject(part_user, this.entityConfig.requiredFields);

        const foundUser = await this.userRepository.findByFields({ username: user.username });
        if (foundUser && await bcrypt.compare(user.password, foundUser.password)) {
            const token = jwt.sign({ id: foundUser.id, username: foundUser.username }, process.env.JWT_SECRET!, { expiresIn: '1h' });
            const { password, ...userWithoutPassword } = foundUser;

            await this.logUserAction({ ...userWithoutPassword, password: ''}, 'logged in');
            return { user: userWithoutPassword, token };
        } else {
            throw new StatusError(401, 'Invalid username or password');
        }
    }

    private async logUserAction(user: User, action: string): Promise<void> {
        const logMessage = `User ${user.username} has been ${action}`;
        const log = {
            timestamp: new Date(),
            type: 'INFO',
            message: logMessage,
            details: JSON.stringify(user),
            user_id: user.id
        } as Log;
        await this.logService.createLog(log);
    }

    private validateUser(user: User): User | Patient | Doctor_Private {
        // Check if user can be validated as a Patient or Doctor objects
        if (user.role === UserType.PATIENT) {
            user = validateObject(user, config.entityValues.patient.requiredFields);
        } else if (user.role === UserType.DOCTOR) {
            user = validateObject(user, config.entityValues.doctor.requiredFields);
        } else if (user.role === UserType.ADMIN) {
            // Logic not implemented yet
        }
        return user;
    }
}