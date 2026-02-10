import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { supabase, Business, BusinessLink, BusinessImage, BusinessFeature, BusinessPackage, BusinessCustomerSegment } from './lib/supabase';
import { 
  ArrowLeft, 
  Edit,
  Trash2,
  ExternalLink,
  DollarSign,
  Percent,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function BusinessDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [links, setLinks] = useState<BusinessLink[]>([]);
  const [images, setImages] = useState<BusinessImage[]>([]);
  const [features, setFeatures] = useState<BusinessFeature[]>([]);
  const [packages, setPackages] = useState<BusinessPackage[]>([]);
  const [customerSegments, setCustomerSegments] = useState<BusinessCustomerSegment[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBusinessData();
    }
  }, [id]);

  const fetchBusinessData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const [businessRes, linksRes, imagesRes, featuresRes, packagesRes, segmentsRes] = await Promise.all([
        supabase.from('businesses').select('*').eq('id', id).single(),
        supabase.from('business_links').select('*').eq('business_id', id),
        supabase.from('business_images').select('*').eq('business_id', id).order('display_order'),
        supabase.from('business_features').select('*').eq('business_id', id).order('display_order'),
        supabase.from('business_packages').select('*').eq('business_id', id).order('display_order'),
        supabase.from('business_customer_segments').select('*').eq('business_id', id)
      ]);

      if (businessRes.error) throw businessRes.error;
      if (businessRes.data) setBusiness(businessRes.data);
      if (linksRes.data) setLinks(linksRes.data);
      if (imagesRes.data) setImages(imagesRes.data);
      if (featuresRes.data) setFeatures(featuresRes.data);
      if (packagesRes.data) setPackages(packagesRes.data);
      if (segmentsRes.data) setCustomerSegments(segmentsRes.data);

    } catch (error) {
      console.error('Error fetching business:', error);
      alert('Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Business deleted successfully');
      navigate('/businesses');
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sold':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'reference':
        return 'bg-blue-100 text-blue-800';
      case 'competitor':
        return 'bg-red-100 text-red-800';
      case 'tool':
        return 'bg-green-100 text-green-800';
      case 'research':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  if (!business) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Business not found</h2>
          <Link to="/businesses" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
            Back to businesses
          </Link>
        </div>
      </Layout>
    );
  }

  const primaryImage = images.find(img => img.is_primary) || images[0];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/businesses"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">{business.title}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(business.status)}`}>
                  {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                </span>
              </div>
              {business.tagline && (
                <p className="text-gray-600 mt-1 text-lg">{business.tagline}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to={`/businesses/${id}/edit`}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Edit size={18} />
              <span>Edit</span>
            </Link>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center space-x-2 px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={18} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Hero Image */}
        {primaryImage && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <img
              src={primaryImage.url}
              alt={primaryImage.caption || business.title}
              className="w-full h-96 object-cover"
            />
            {primaryImage.caption && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <p className="text-sm text-gray-600">{primaryImage.caption}</p>
              </div>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-indigo-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(business.price)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Percent className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Equity</p>
                <p className="text-2xl font-bold text-gray-900">{business.equity_percentage}%</p>
              </div>
            </div>
          </div>

          {business.scalability_score && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Scalability</p>
                  <p className="text-2xl font-bold text-gray-900">{business.scalability_score}/10</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(business.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
              {business.description && (
                <p className="text-gray-700 mb-4">{business.description}</p>
              )}
              {business.full_description && (
                <div className="text-gray-600 whitespace-pre-wrap">{business.full_description}</div>
              )}
              {!business.description && !business.full_description && (
                <p className="text-gray-400 italic">No description provided</p>
              )}
            </div>

            {/* Features */}
            {features.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Key Features</h2>
                <div className="space-y-3">
                  {features.map((feature) => (
                    <div key={feature.id} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-indigo-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        {feature.icon ? (
                          <span className="text-sm">{feature.icon}</span>
                        ) : (
                          <CheckCircle className="text-indigo-600" size={16} />
                        )}
                      </div>
                      <p className="text-gray-700 flex-1">{feature.feature_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Package Contents */}
            {packages.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">What's Included</h2>
                <div className="space-y-3">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {pkg.is_included ? (
                          <CheckCircle className="text-green-600" size={20} />
                        ) : (
                          <XCircle className="text-gray-400" size={20} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${pkg.is_included ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                          {pkg.package_item}
                        </p>
                        {pkg.description && (
                          <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Segments */}
            {customerSegments.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Target Customers</h2>
                <div className="space-y-4">
                  {customerSegments.map((segment) => (
                    <div key={segment.id} className="border-l-4 border-indigo-500 pl-4">
                      <h3 className="font-semibold text-gray-900">{segment.segment_name}</h3>
                      {segment.description && (
                        <p className="text-gray-600 mt-1">{segment.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links & Resources */}
            {links.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Links & Resources</h2>
                <div className="space-y-3">
                  {links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink className="text-indigo-600 flex-shrink-0 mt-1" size={18} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">{link.title}</h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getCategoryColor(link.category)}`}>
                            {link.category}
                          </span>
                        </div>
                        {link.description && (
                          <p className="text-sm text-gray-600 mb-1">{link.description}</p>
                        )}
                        <p className="text-xs text-gray-500 truncate">{link.url}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Business Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Business Details</h2>
              <div className="space-y-3">
                {business.industry && (
                  <div>
                    <p className="text-sm text-gray-600">Industry</p>
                    <p className="font-medium text-gray-900">{business.industry}</p>
                  </div>
                )}
                {business.business_type && (
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium text-gray-900">{business.business_type}</p>
                  </div>
                )}
                {business.target_revenue && (
                  <div>
                    <p className="text-sm text-gray-600">Target Revenue</p>
                    <p className="font-medium text-gray-900">{business.target_revenue}</p>
                  </div>
                )}
                {business.time_to_revenue && (
                  <div>
                    <p className="text-sm text-gray-600">Time to Revenue</p>
                    <p className="font-medium text-gray-900">{business.time_to_revenue}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Image Gallery */}
            {images.length > 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Gallery ({images.length})</h2>
                <div className="grid grid-cols-2 gap-3">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.url}
                        alt={image.caption || ''}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      {image.is_primary && (
                        <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Business</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{business.title}"? This action cannot be undone and will remove all associated data.
            </p>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete Permanently
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
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