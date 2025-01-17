import { DepartmentService } from "../../../app/department/department.service";
import { DepartmentRepository } from "../../../app/department/department.repository";
import { LogService } from "../../../app/log/log.service";
import { UserType } from "../../../app/user/user.model";
import { Department } from "../../../app/department/department.model";
import {Session} from "express-session";
import {StatusError} from "../../../utils/status_error";

describe('DepartmentService', () => {
    let departmentService: DepartmentService;
    let mockDepartmentRepository: jest.Mocked<DepartmentRepository>;
    let mockLogService: jest.Mocked<LogService>;
    
    beforeAll(() => {
        mockDepartmentRepository = {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findAll: jest.fn()
        } as unknown as jest.Mocked<DepartmentRepository>;
        mockLogService = {
            createLog: jest.fn()
        } as unknown as jest.Mocked<LogService>;
        departmentService = new DepartmentService(mockDepartmentRepository, mockLogService);
    });

    // Admin user can create new departments
    it('should allow admin to create new department', async () => {
      const mockSession = { role: UserType.ADMIN, userId: 1 } as unknown as Session ;
      const newDept = { name: 'Cardiology', description: 'Heart department', services: [], doctors: [] };

      mockDepartmentRepository.create.mockResolvedValue( { id: 1, ...newDept });

      const result = await departmentService.create(mockSession, newDept);
  
      expect(result).toBeDefined();
      expect(mockDepartmentRepository.create).toHaveBeenCalledWith(newDept);
      expect(mockLogService.createLog).toHaveBeenCalled();
    });

    // Admin user can update existing departments
    it('should allow admin to update department', async () => {
      const mockSession = { role: UserType.ADMIN, userId: 1 } as unknown as Session;
      const updates = { description: 'Updated description' };
      const deptId = 1;

      mockDepartmentRepository.update.mockResolvedValue( { id: 1, ...updates } as Department);

        const result = await departmentService.update(mockSession, deptId, updates);
  
      expect(result).toBeDefined();
      expect(mockDepartmentRepository.update).toHaveBeenCalledWith(deptId, updates);
      expect(mockLogService.createLog).toHaveBeenCalled();
    });

    // Admin user can delete departments
    it('should allow admin to delete department', async () => {
      const mockSession = { role: UserType.ADMIN, userId: 1 } as unknown as Session;
      const deptId = 1;

        mockDepartmentRepository.delete.mockResolvedValue( { id: 1 } as Department);

        const result = await departmentService.delete(mockSession, deptId);
  
      expect(result).toBeDefined();
      expect(mockDepartmentRepository.delete).toHaveBeenCalledWith(deptId);
      expect(mockLogService.createLog).toHaveBeenCalled();
    });

    // Non-admin users can view departments
    it('should allow non-admin users to view departments', async () => {
      const mockSession = { role: UserType.DOCTOR, userId: 1 } as unknown as Session;
      const mockDepts = [
          {
              id: 1, 
              name: 'Test Dept',
              description: 'Test department',
              services: [
                    { name: 'Test Service', type: 'Test' }
              ],
          } as Department
      ];
      mockDepartmentRepository.findAll.mockResolvedValue(mockDepts);
  
      const result = await departmentService.findAll(mockSession);
  
      expect(result).toEqual(mockDepts);
      expect(mockLogService.createLog).toHaveBeenCalled();
    });

    // Non-admin users receive 403 error when trying to create departments
    it('should throw 403 error when non-admin tries to create department', async () => {
      const mockSession = { role: UserType.DOCTOR, userId: 1 } as unknown as Session;
      const newDept = { name: 'Test', description: 'Test dept' };
  
      await expect(departmentService.create(mockSession, newDept))
        .rejects
        .toThrow(new StatusError(403, 'Only admins can create departments'));
    });

    // Non-admin users receive 403 error when trying to update departments
    it('should throw 403 error when non-admin tries to update department', async () => {
      const mockSession = { role: UserType.DOCTOR, userId: 1 } as unknown as Session;
      const updates = { description: 'Updated' };
  
      await expect(departmentService.update(mockSession, 1, updates))
        .rejects
        .toThrow(new StatusError(403, 'Only admins can update departments'));
    });

    // Non-admin users receive 403 error when trying to delete departments
    it('should throw 403 error when non-admin tries to delete department', async () => {
      const mockSession = { role: UserType.DOCTOR, userId: 1 } as unknown as Session;
  
      await expect(departmentService.delete(mockSession, 1))
        .rejects
        .toThrow(new StatusError(403, 'Only admins can delete departments'));
    });

    // Session without role information triggers error
    it('should throw error when session has no role', async () => {
      const mockSession = { userId: 1 } as unknown as Session;
      const newDept = { name: 'Test', description: 'Test dept' };
  
      await expect(departmentService.create(mockSession, newDept))
        .rejects
        .toThrow();
    });

    // Empty or invalid session object handling
    it('should handle invalid session object', async () => {
      const invalidSession = null as unknown as Session;
      const newDept = { name: 'Test', description: 'Test dept' };
  
      await expect(departmentService.create(invalidSession, newDept))
        .rejects
        .toThrow();
    });
});