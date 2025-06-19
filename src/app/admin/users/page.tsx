'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc-client';
import { formatPrice } from '@/lib/utils';
import { 
  FaSearch, 
  FaWallet, 
  FaPlus, 
  FaMinus, 
  FaCoins, 
  FaUserCog, 
  FaEye,
  FaUser,
  FaShoppingBag,
  FaTicketAlt,
  FaBoxOpen,
  FaList,
  FaLayerGroup,
  FaCog
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { format, formatDistanceToNow } from 'date-fns';
import { ActivityLog } from '@/interfaces';

// Define the role type to match Prisma's Role enum
type UserRole = 'USER' | 'ADMIN' | 'MANAGER' | 'SUPPORTER' | 'BANNED';

// Define the allowed roles for the role update mutation
type AllowedRole = 'USER' | 'MANAGER' | 'SUPPORTER' | 'BANNED';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [operation, setOperation] = useState<'ADD' | 'SUBTRACT' | 'SET'>('ADD');
  const [reason, setReason] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AllowedRole>('USER');

  // Get users with pagination
  const {
    data: usersData,
    isLoading,
    refetch,
  } = trpc.admin.getUsers.useQuery({
    limit: 20,
    search: search.length > 0 ? search : undefined,
  });

  // Get selected user details
  const { data: selectedUser } = trpc.admin.getUserById.useQuery(
    { id: selectedUserId || '' },
    { enabled: !!selectedUserId }
  );

  // Get detailed user information for the modal
  const { data: userDetails, isLoading: isLoadingDetails } = trpc.admin.getUserDetails.useQuery(
    { id: selectedUserId || '' },
    { enabled: !!selectedUserId && isUserDetailsModalOpen }
  );

  // Update balance mutation
  const updateBalance = trpc.admin.updateUserBalance.useMutation({
    onSuccess: () => {
      toast.success('User balance updated successfully');
      refetch();
      closeModal();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Update role mutation
  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success('User role updated successfully');
      refetch();
      closeRoleModal();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const openModal = (userId: string) => {
    setSelectedUserId(userId);
    setAmount(0);
    setOperation('ADD');
    setReason('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
  };

  const openRoleModal = (userId: string, currentRole: string) => {
    setSelectedUserId(userId);
    // Default to USER if the current role is ADMIN (which shouldn't be editable)
    const initialRole = currentRole === 'ADMIN' ? 'USER' : currentRole as AllowedRole;
    setSelectedRole(initialRole);
    setIsRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    setIsRoleModalOpen(false);
    setSelectedUserId(null);
  };

  const openUserDetailsModal = (userId: string) => {
    setSelectedUserId(userId);
    setIsUserDetailsModalOpen(true);
  };

  const closeUserDetailsModal = () => {
    setIsUserDetailsModalOpen(false);
    setSelectedUserId(null);
  };

  const handleUpdateBalance = () => {
    if (!selectedUserId) return;
    
    updateBalance.mutate({
      userId: selectedUserId,
      amount,
      operation,
      reason,
    });
  };

  const handleUpdateRole = () => {
    if (!selectedUserId) return;
    
    updateRole.mutate({
      userId: selectedUserId,
      role: selectedRole,
    });
  };

  // Helper function to get badge class based on role
  const getRoleBadgeClass = (role: string): string => {
    switch (role) {
      case 'ADMIN':
        return 'admin-badge-info';
      case 'MANAGER':
        return 'admin-badge-success';
      case 'SUPPORTER':
        return 'admin-badge-warning';
      case 'BANNED':
        return 'admin-badge-danger';
      default:
        return 'admin-badge-secondary';
    }
  };

  // Helper function to get button class based on selected role
  const getRoleButtonClass = (buttonRole: AllowedRole, currentSelected: AllowedRole): string => {
    const baseClass = 'py-3 px-4 rounded-md flex items-center justify-center transition-colors';
    
    if (buttonRole === currentSelected) {
      switch (buttonRole) {
        case 'MANAGER':
          return `${baseClass} bg-green-900/50 text-green-300 border border-green-500/30`;
        case 'SUPPORTER':
          return `${baseClass} bg-yellow-900/50 text-yellow-300 border border-yellow-500/30`;
        case 'USER':
          return `${baseClass} bg-blue-900/50 text-blue-300 border border-blue-500/30`;
        case 'BANNED':
          return `${baseClass} bg-red-900/50 text-red-300 border border-red-500/30`;
      }
    }
    
    return `${baseClass} bg-black/30 border border-gray-700`;
  };

  // Helper function to format date
  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'PPP p');
  };
  
  // Helper function to format relative time
  const formatTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  // Helper function to get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'USER_REGISTRATION':
        return <FaUser />;
      case 'ORDER_CREATED':
        return <FaShoppingBag />;
      case 'TICKET_SUBMITTED':
        return <FaTicketAlt />;
      case 'PRODUCT_ADDED':
        return <FaBoxOpen />;
      case 'CATEGORY_CREATED':
        return <FaList />;
      case 'STOCK_ADDED':
        return <FaLayerGroup />;
      case 'SETTINGS_UPDATED':
        return <FaCog />;
      case 'BALANCE_REFUND':
        return <FaWallet />;
      default:
        return <FaShoppingBag />;
    }
  };

  // Helper function to get activity color
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'USER_REGISTRATION':
        return 'admin-icon-green';
      case 'ORDER_CREATED':
        return 'admin-icon-blue';
      case 'TICKET_SUBMITTED':
        return 'admin-icon-yellow';
      case 'PRODUCT_ADDED':
        return 'admin-icon-primary';
      case 'CATEGORY_CREATED':
        return 'admin-icon-purple';
      case 'STOCK_ADDED':
        return 'admin-icon-cyan';
      case 'SETTINGS_UPDATED':
        return 'admin-icon-orange';
      case 'BALANCE_REFUND':
        return 'admin-icon-red';
      default:
        return 'admin-icon-blue';
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div>
      <div className="admin-header">
        <h1>User Management</h1>
        <p>View and manage user accounts</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <form onSubmit={handleSearch} className="flex w-full max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="admin-input pr-10 w-full"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
            >
              <FaSearch />
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="w-[48px]"></th>
                <th>Name/Email</th>
                <th>Balance</th>
                <th>Role</th>
                <th>Orders</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersData?.users.map((user) => (
                <tr key={user.id}>
                  <td className="w-[48px] text-center">
                    <button
                      onClick={() => openUserDetailsModal(user.id)}
                      className="admin-icon-btn"
                      type="button"
                      title="View user details"
                    >
                      <FaEye size={14} />
                    </button>
                  </td>
                  <td>
                    <div>
                      <div className="font-medium">{user.name || 'No Name'}</div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </div>
                  </td>
                  <td>
                    <span className="font-medium text-green-500">
                      {formatPrice(Number(user.balance))}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user._count.orders}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(user.id)}
                        className="admin-button flex items-center gap-1 py-1 px-3 text-sm"
                        type="button"
                        title="Manage user balance"
                      >
                        <FaWallet size={12} /> Balance
                      </button>
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => openRoleModal(user.id, user.role)}
                          className="admin-button flex items-center gap-1 py-1 px-3 text-sm"
                          type="button"
                          title="Change user role"
                        >
                          <FaUserCog size={12} /> Role
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {usersData?.users.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Balance Update Modal */}
      {isModalOpen && selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal max-w-md">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Update Balance</h2>
              <button 
                onClick={closeModal}
                className="admin-modal-close"
                type="button"
              >
                &times;
              </button>
            </div>
            
            <div className="admin-modal-body">
              <div className="mb-4">
                <div className="text-sm text-gray-400">User</div>
                <div className="font-medium">{selectedUser.name || 'No Name'}</div>
                <div className="text-sm text-gray-400">{selectedUser.email}</div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-gray-400">Current Balance</div>
                <div className="font-medium text-green-500">
                  {formatPrice(Number(selectedUser.balance))}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Operation</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setOperation('ADD')}
                    className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center transition-colors ${
                      operation === 'ADD' ? 'bg-green-900/50 text-green-300 border border-green-500/30' : 'bg-black/30 border border-gray-700'
                    }`}
                  >
                    <FaPlus className="mr-1" /> Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperation('SUBTRACT')}
                    className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center transition-colors ${
                      operation === 'SUBTRACT' ? 'bg-red-900/50 text-red-300 border border-red-500/30' : 'bg-black/30 border border-gray-700'
                    }`}
                  >
                    <FaMinus className="mr-1" /> Subtract
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperation('SET')}
                    className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center transition-colors ${
                      operation === 'SET' ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' : 'bg-black/30 border border-gray-700'
                    }`}
                  >
                    <FaCoins className="mr-1" /> Set
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="amount" className="block text-sm font-medium mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  className="admin-input w-full"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="reason" className="block text-sm font-medium mb-2">
                  Reason (for audit)
                </label>
                <input
                  type="text"
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="admin-input w-full"
                  placeholder="e.g., Manual deposit, Refund, etc."
                  required
                />
              </div>
            </div>
            
            <div className="admin-modal-footer">
              <button
                type="button"
                onClick={closeModal}
                className="admin-button-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateBalance}
                className="admin-button"
                disabled={updateBalance.isPending || !amount || !reason}
              >
                {updateBalance.isPending ? 'Processing...' : 'Update Balance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Update Modal */}
      {isRoleModalOpen && selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Update User Role</h2>
              <button 
                onClick={closeRoleModal}
                className="admin-modal-close"
                type="button"
              >
                &times;
              </button>
            </div>
            
            <div className="admin-modal-body">
              <div className="mb-4">
                <div className="text-sm text-gray-400">User</div>
                <div className="font-medium">{selectedUser.name || 'No Name'}</div>
                <div className="text-sm text-gray-400">{selectedUser.email}</div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-gray-400">Current Role</div>
                <div className="font-medium">
                  <span className={`admin-badge ${getRoleBadgeClass(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">New Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('MANAGER')}
                    className={getRoleButtonClass('MANAGER', selectedRole)}
                  >
                    Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('SUPPORTER')}
                    className={getRoleButtonClass('SUPPORTER', selectedRole)}
                  >
                    Supporter
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('USER')}
                    className={getRoleButtonClass('USER', selectedRole)}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('BANNED')}
                    className={getRoleButtonClass('BANNED', selectedRole)}
                  >
                    Banned
                  </button>
                </div>
              </div>
              
              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={closeRoleModal}
                  className="admin-button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateRole}
                  className="admin-button"
                  disabled={updateRole.isPending || selectedRole === selectedUser.role}
                >
                  {updateRole.isPending ? 'Processing...' : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {isUserDetailsModalOpen && userDetails && (
        <div className="admin-modal-overlay">
          <div className="admin-modal max-w-4xl">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">User Details</h2>
              <button 
                onClick={closeUserDetailsModal}
                className="admin-modal-close"
                type="button"
              >
                &times;
              </button>
            </div>
            
            <div className="admin-modal-body">
              {isLoadingDetails ? (
                <div className="text-center py-10">Loading user details...</div>
              ) : (
                <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2">
                  {/* User Information Section */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4 border-b border-gray-700 pb-2">
                      User Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-400">Name</div>
                        <div className="font-medium">{userDetails.name || 'No Name'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Email</div>
                        <div className="font-medium">{userDetails.email}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Role</div>
                        <div className="font-medium">
                          <span className={`admin-badge ${getRoleBadgeClass(userDetails.role)}`}>
                            {userDetails.role}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Balance</div>
                        <div className="font-medium text-green-500">
                          {formatPrice(Number(userDetails.balance))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Registered</div>
                        <div className="font-medium">{formatDate(userDetails.createdAt)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Last Updated</div>
                        <div className="font-medium">{formatDate(userDetails.updatedAt)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Orders Section */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4 border-b border-gray-700 pb-2">
                      Orders
                    </h3>
                    {userDetails.orders.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Status</th>
                              <th>Items</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userDetails.orders.map((order) => (
                              <tr key={order.id}>
                                <td className="font-mono text-xs">{order.id}</td>
                                <td>{formatDate(order.createdAt)}</td>
                                <td className="text-green-500">{formatPrice(Number(order.totalAmount))}</td>
                                <td>
                                  <span className={`admin-badge ${
                                    order.status === 'COMPLETED' ? 'admin-badge-success' :
                                    order.status === 'PENDING' ? 'admin-badge-warning' :
                                    order.status === 'PROCESSING' ? 'admin-badge-info' :
                                    'admin-badge-danger'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td>{order._count.orderItems}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-gray-400">No orders found for this user.</div>
                    )}
                  </div>
                  
                  {/* Activity Logs Section */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4 border-b border-gray-700 pb-2">
                      Activity Logs
                    </h3>
                    {userDetails.activityLogs && userDetails.activityLogs.length > 0 ? (
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {userDetails.activityLogs.map((log: ActivityLog) => (
                          <div 
                            key={log.id} 
                            className="flex items-center p-3 bg-black/20 rounded-lg border border-gray-800 hover:bg-black/30 transition-colors"
                          >
                            <div className={`admin-icon ${getActivityColor(log.type)} w-10 h-10`}>
                              {getActivityIcon(log.type)}
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="text-sm font-medium text-white">{log.type.replace(/_/g, ' ')}</div>
                              <div className="text-xs text-gray-400">{log.message}</div>
                            </div>
                            <div className="ml-auto text-xs text-gray-500" title={formatDate(log.createdAt)}>
                              {formatTime(log.createdAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400">No activity logs found for this user.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="admin-modal-footer">
              <button
                type="button"
                onClick={closeUserDetailsModal}
                className="admin-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 