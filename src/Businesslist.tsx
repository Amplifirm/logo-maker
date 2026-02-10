import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from './components/Layout';
import { supabase, Business } from './lib/supabase';
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  Trash2,
  MoreVertical
} from 'lucide-react';

export default function BusinessList() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    filterBusinesses();
  }, [businesses, searchTerm, statusFilter]);

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setBusinesses(data);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBusinesses = () => {
    let filtered = businesses;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.title.toLowerCase().includes(term) ||
        b.description?.toLowerCase().includes(term) ||
        b.industry?.toLowerCase().includes(term)
      );
    }

    setFilteredBusinesses(filtered);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBusinesses(businesses.filter(b => b.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting business:', error);
      alert('Failed to delete business');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Businesses</h1>
            <p className="text-gray-600 mt-1">Manage your pre-made digital business portfolio</p>
          </div>
          <Link
            to="/businesses/new"
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            <span className="font-medium">Add New Business</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium text-gray-900">{filteredBusinesses.length}</span> of{' '}
          <span className="font-medium text-gray-900">{businesses.length}</span> businesses
        </div>

        {/* Business Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBusinesses.map((business) => (
            <div key={business.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{business.title}</h3>
                    {business.tagline && (
                      <p className="text-sm text-gray-600">{business.tagline}</p>
                    )}
                  </div>
                  <div className="relative group">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical size={20} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                {business.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {business.description}
                  </p>
                )}

                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(business.status)}`}>
                    {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                  </span>
                  {business.industry && (
                    <span className="text-sm text-gray-500">{business.industry}</span>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(business.price)}</p>
                      <p className="text-sm text-gray-500">{business.equity_percentage}% equity retainer</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-4">
                    Created {formatDate(business.created_at)}
                  </p>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/businesses/${business.id}`}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Eye size={16} />
                      <span className="text-sm font-medium">View</span>
                    </Link>
                    <Link
                      to={`/businesses/${business.id}/edit`}
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(business.id)}
                      className="flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBusinesses.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Search className="mx-auto text-gray-400" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No businesses found</h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first business'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link
                to="/businesses/new"
                className="inline-flex items-center space-x-2 mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={20} />
                <span>Add Your First Business</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Business</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this business? This action cannot be undone.
            </p>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}