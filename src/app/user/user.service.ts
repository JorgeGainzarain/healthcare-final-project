import { Service } from 'typedi';
import { AuditService } from '../audit/audit.service';
import { User } from './user.model';
import { UserRepository } from './user.repository';
import { BaseService } from "../base/base.service";
import { config } from "../../config/environment";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { StatusError } from "../../utils/status_error";
import {validateObject} from "../../utils/validation";

dotenv.config();

@Service()
export class UserService extends BaseService<User> {
    protected entityConfig = config.entityValues.user;

    constructor(
        protected auditService: AuditService,
        protected userRepository: UserRepository
    ) {
        super(auditService, userRepository);
    }

    public async register(part_user: Partial<User>): Promise<Omit<User, 'password'>> {
        const user = validateObject(part_user, this.entityConfig.requiredFields)

        const saltRounds = 10;
        user.password = await bcrypt.hash(user.password, saltRounds);
        const createdUser = await this.userRepository.create(user);
        const { password, ...userWithoutPassword } = createdUser;

        await this.auditAction({ ...userWithoutPassword, password: ''} as User , 'registered');
        return userWithoutPassword;
    }

    public async login(part_user: Partial<User>): Promise<{ user: Omit<User, 'password'>, token: string }> {
        const user = validateObject(part_user, this.entityConfig.requiredFields);

        const foundUser = await this.userRepository.findByFields({ username: user.username });
        if (foundUser && await bcrypt.compare(user.password, foundUser.password)) {
            const token = jwt.sign({ id: foundUser.id, username: foundUser.username }, process.env.JWT_SECRET!, { expiresIn: '1h' });
            const { password, ...userWithoutPassword } = foundUser;

            await this.auditAction({ ...userWithoutPassword, password: ''}, 'logged in');
            return { user: userWithoutPassword, token };
        } else {
            throw new StatusError(401, 'Invalid username or password');
        }
    }
}