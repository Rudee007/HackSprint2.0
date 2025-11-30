import { useState } from 'react';
import { Search, Filter, Star, MessageSquare, User, ThumbsUp, ThumbsDown, Flag } from 'lucide-react';

const FeedbackManagement = () => {
  // Mock feedback data
  const [feedbacks, setFeedbacks] = useState([
    { 
      id: 1, 
      patientName: 'Rahul Sharma', 
      doctorName: 'Dr. Priya Patel', 
      date: '15 Jul 2023', 
      rating: 5,
      comment: 'Excellent consultation. Dr. Patel was very thorough and explained everything clearly.',
      status: 'Published'
    },
    { 
      id: 2, 
      patientName: 'Amit Kumar', 
      doctorName: 'Dr. Vikram Singh', 
      date: '14 Jul 2023', 
      rating: 4,
      comment: 'Good experience overall. The doctor was knowledgeable but the wait time was a bit long.',
      status: 'Published'
    },
    { 
      id: 3, 
      patientName: 'Neha Gupta', 
      doctorName: 'Dr. Ananya Reddy', 
      date: '13 Jul 2023', 
      rating: 5,
      comment: 'Dr. Reddy is amazing! She took the time to understand my concerns and provided excellent advice.',
      status: 'Published'
    },
    { 
      id: 4, 
      patientName: 'Sanjay Verma', 
      doctorName: 'Dr. Priya Patel', 
      date: '12 Jul 2023', 
      rating: 2,
      comment: 'Not satisfied with the consultation. The doctor seemed rushed and didn\'t address all my concerns.',
      status: 'Flagged'
    },
    { 
      id: 5, 
      patientName: 'Rajesh Khanna', 
      doctorName: 'Dr. Vikram Singh', 
      date: '11 Jul 2023', 
      rating: 3,
      comment: 'Average experience. The treatment was okay but I expected more detailed explanations.',
      status: 'Published'
    },
    { 
      id: 6, 
      patientName: 'Meera Joshi', 
      doctorName: 'Dr. Ananya Reddy', 
      date: '10 Jul 2023', 
      rating: 5,
      comment: 'Wonderful experience! Dr. Reddy is very patient and knowledgeable. Highly recommend!',
      status: 'Published'
    },
    { 
      id: 7, 
      patientName: 'Kiran Rao', 
      doctorName: 'Dr. Priya Patel', 
      date: '09 Jul 2023', 
      rating: 1,
      comment: 'Terrible experience. Long wait time and the doctor was dismissive of my symptoms.',
      status: 'Hidden'
    },
    { 
      id: 8, 
      patientName: 'Vivek Oberoi', 
      doctorName: 'Dr. Vikram Singh', 
      date: '08 Jul 2023', 
      rating: 4,
      comment: 'Good consultation. Dr. Singh provided clear instructions for my treatment plan.',
      status: 'Published'
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRating, setSelectedRating] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Filter feedbacks based on search term, rating, and status
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = 
      feedback.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      feedback.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = selectedRating === 'All' || feedback.rating === parseInt(selectedRating);
    const matchesStatus = selectedStatus === 'All' || feedback.status === selectedStatus;
    
    return matchesSearch && matchesRating && matchesStatus;
  });

  // Handle feedback status change
  const handleStatusChange = (feedbackId, newStatus) => {
    setFeedbacks(feedbacks.map(feedback => {
      if (feedback.id === feedbackId) {
        return { ...feedback, status: newStatus };
      }
      return feedback;
    }));
  };

  // Render star rating
  const renderStarRating = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
          <Star 
            key={index} 
            className={`h-4 w-4 ${index < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} 
          />
        ))}
        <span className="ml-1 text-sm text-slate-600">{rating}/5</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Feedback Management</h2>
        <div className="flex space-x-2">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            Export Feedback
          </button>
          <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            Generate Report
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by patient, doctor, or comment..."
              className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <select 
                className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm"
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
              >
                <option value="All">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
            
            <select 
              className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Hidden">Hidden</option>
              <option value="Flagged">Flagged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Average Rating</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800">4.2</h3>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Feedback</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800">{feedbacks.length}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Positive Feedback</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800">
                {feedbacks.filter(f => f.rating >= 4).length}
              </h3>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <ThumbsUp className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Negative Feedback</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800">
                {feedbacks.filter(f => f.rating <= 2).length}
              </h3>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <ThumbsDown className="h-6 w-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Rating
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Comment
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredFeedbacks.length > 0 ? (
                filteredFeedbacks.map((feedback) => (
                  <tr key={feedback.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{feedback.patientName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{feedback.doctorName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStarRating(feedback.rating)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 max-w-xs truncate">{feedback.comment}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {feedback.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        feedback.status === 'Published' ? 'bg-green-100 text-green-800' :
                        feedback.status === 'Hidden' ? 'bg-slate-100 text-slate-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {feedback.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {feedback.status === 'Published' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(feedback.id, 'Hidden')}
                              className="px-2 py-1 bg-slate-50 text-slate-600 rounded-md text-xs font-medium hover:bg-slate-100"
                            >
                              Hide
                            </button>
                            <button 
                              onClick={() => handleStatusChange(feedback.id, 'Flagged')}
                              className="px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-xs font-medium hover:bg-amber-100"
                            >
                              <Flag className="h-3 w-3" />
                            </button>
                          </>
                        )}
                        {feedback.status === 'Hidden' && (
                          <button 
                            onClick={() => handleStatusChange(feedback.id, 'Published')}
                            className="px-2 py-1 bg-green-50 text-green-600 rounded-md text-xs font-medium hover:bg-green-100"
                          >
                            Publish
                          </button>
                        )}
                        {feedback.status === 'Flagged' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(feedback.id, 'Published')}
                              className="px-2 py-1 bg-green-50 text-green-600 rounded-md text-xs font-medium hover:bg-green-100"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleStatusChange(feedback.id, 'Hidden')}
                              className="px-2 py-1 bg-red-50 text-red-600 rounded-md text-xs font-medium hover:bg-red-100"
                            >
                              Remove
                            </button>
                          </>
                        )}
                        <button className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs font-medium hover:bg-indigo-100">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-slate-500">
                    No feedback found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredFeedbacks.length}</span> of{' '}
                <span className="font-medium">{filteredFeedbacks.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50">
                  Previous
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackManagement;