

import React from 'react';
import Tabs from '../../../component/Tabs/Tabs';
import HolidayManagement from '../../../components/Setting/HolidayManagement';
import BranchManagement from '../../../components/Setting/BranchManagement';
import DepartmentManagement from '../../../components/Setting/DepartmentManagement';
import PositionManagement from '../../../components/Setting/PositionManagement';
import SalaryTypeManagement from '../../../components/Setting/SalaryTypeManagement';
import RoleManagement from '../../../components/Setting/RoleManagement';
import StatusManagement from '../../../components/Setting/StatusManagement';


/**
 * AdminManagement Page
 *
 * This page serves as a centralized hub for managing various entities
 * such as Branches, Departments, Positions, Salary Types, Roles, Statuses, and Work Statuses.
 */
function AdminManagement() {
  const tabs = [
    'Branches',
    'Departments',
    'Positions',
    'Salary Types',
    'Roles',
    'Statuses',
    'Holidays',
  ];

  return (
    <div className="relative p-5 bg-dashboard-gradient shadow-lg h-[305px] opacity-100 w-full rounded-none m-0">
      <h1 className="text-2xl font-bold mb-6 w-content text-white">Admin Management</h1>
      <Tabs tabs={tabs}>
        <BranchManagement />
        <DepartmentManagement />
        <PositionManagement />
        <SalaryTypeManagement />
        <RoleManagement />
        <StatusManagement />
        <HolidayManagement />
      </Tabs>
    </div>
  );
}

export default AdminManagement;