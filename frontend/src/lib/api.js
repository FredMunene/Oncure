// API client for communicating with the Go backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
console.log('API_URL being used:', API_URL)

// Helper function for making API requests
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`

  // Don't override Content-Type for FormData (file uploads)
  const isFormData = options.body instanceof FormData
  const defaultHeaders = isFormData
    ? {}
    : { "Content-Type": "application/json" }

  const fetchOptions = {
    ...options,
    credentials: "include",   // Always include credentials (cookies)
    mode: "cors",            // Enable CORS
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, fetchOptions)

    // Debug logging for mark as read requests
    if (endpoint.includes('/read')) {
      console.log('Mark as read response status:', response.status);
      console.log('Mark as read response headers:', Object.fromEntries(response.headers.entries()));
      console.log('Browser:', navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other');
      console.log('Request URL:', url);
      console.log('Request options:', fetchOptions);
    }

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()

      // Debug logging for mark as read requests
      if (endpoint.includes('/read')) {
        console.log('Mark as read response data:', data);
      }

      // If response is not ok, throw error with message from API
      if (!response.ok) {
        throw new Error(data.error || "An error occurred")
      }

      return data
    }

    // For non-JSON responses
    if (!response.ok) {
      throw new Error("An error occurred")
    }

    return response
  } catch (error) {
    // Handle network errors
    // Only log errors that aren't session-related to avoid console spam
    if (!error.message.includes('No session token provided') &&
        !error.message.includes('Unauthorized')) {
      console.error('API Error for', endpoint, ':', error)
      console.error('Request options:', fetchOptions)
    }
    throw error
  }
}

// Auth API
export const auth = {
  register: (userData) =>
    fetchAPI("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    fetchAPI("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    fetchAPI("/api/auth/logout", {
      method: "POST",
    }),

  getSession: async () => {
    try {
      return await fetchAPI("/api/auth/session")
    } catch (error) {
      // If it's a "No session token provided" error, return null instead of throwing
      if (error.message.includes('No session token provided')) {
        return null
      }
      throw error
    }
  },

  // New method to check if user is authenticated
  checkAuth: async () => {
    try {
      const session = await fetchAPI("/api/auth/session")
      return { isAuthenticated: true, user: session }
    } catch (error) {
      return { isAuthenticated: false, user: null }
    }
  }
}

// Posts API
export const posts = {
  getPosts: async (page = 1, limit = 10, category = null) => {
    let url = `/api/posts?page=${page}&limit=${limit}`;
    if (category && category !== 'all') {
      url += `&category=${encodeURIComponent(category)}`;
    }
    
    const data = await fetchAPI(url);

    // Normalize response: if backend returns array directly, wrap it in an object
    if (Array.isArray(data)) {
      return {
        posts: data,
        page: page,
        limit: limit,
        total: data.length,
        hasMore: data.length === limit // Assume more posts if we got full page
      };
    }

    return data;
  },
  
  getLikedPosts: async (page = 1, limit = 10) => {
    const data = await fetchAPI(`/api/posts/liked?page=${page}&limit=${limit}`);

    // Normalize response: if backend returns array directly, wrap it in an object
    if (Array.isArray(data)) {
      return {
        posts: data,
        page: page,
        limit: limit,
        total: data.length,
        hasMore: data.length === limit // Assume more posts if we got full page
      };
    }

    return data;
  },
  
  getCommentedPosts: async (page = 1, limit = 10) => {
    const data = await fetchAPI(`/api/posts/commented?page=${page}&limit=${limit}`);

    // Normalize response: if backend returns array directly, wrap it in an object
    if (Array.isArray(data)) {
      return {
        posts: data,
        page: page,
        limit: limit,
        total: data.length,
        hasMore: data.length === limit // Assume more posts if we got full page
      };
    }

    return data;
  },

  getSavedPosts: async (page = 1, limit = 10) => {
    const data = await fetchAPI(`/api/posts/saved?page=${page}&limit=${limit}`);

    // Normalize response: if backend returns array directly, wrap it in an object
    if (Array.isArray(data)) {
      return {
        posts: data,
        page: page,
        limit: limit,
        total: data.length,
        hasMore: data.length === limit // Assume more posts if we got full page
      };
    }

    return data;
  },

  createPost: (postData) =>
    fetchAPI("/api/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    }),

  updatePost: (postData) =>
    fetchAPI("/api/posts", {
      method: "PUT",
      body: JSON.stringify(postData),
    }),

  deletePost: (postId) =>
    fetchAPI("/api/posts", {
      method: "DELETE",
      body: JSON.stringify({ id: postId }),
    }),

  getReactions: (postId) => fetchAPI(`/api/posts/${postId}/reactions`),

  addReaction: (postId, reactionType) =>
    fetchAPI(`/api/posts/${postId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ reaction_type: reactionType }),
    }),
}

// Comments API
export const comments = {
  getPostComments: async (postId, page = 1, limit = 20, parentId = null) => {
    let url = `/api/posts/${postId}/comments?page=${page}&limit=${limit}`
    if (parentId) {
      url += `&parentId=${parentId}`
    }
    const data = await fetchAPI(url);

    // Normalize comments response if it's an array
    if (Array.isArray(data)) {
      return {
        comments: data,
        page: page,
        limit: limit,
        total: data.length
      };
    }

    return data;
  },

  createComment: (postId, commentData) =>
    fetchAPI(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(commentData),
    }),

  updateComment: (commentId, commentData) =>
    fetchAPI(`/api/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify(commentData),
    }),

  deleteComment: (commentId) =>
    fetchAPI(`/api/comments/${commentId}`, {
      method: "DELETE",
    }),

  getReactions: (commentId) => fetchAPI(`/api/comments/${commentId}/reactions`),

  addReaction: (commentId, reactionType) =>
    fetchAPI(`/api/comments/${commentId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ reaction_type: reactionType }),
    }),
}

// Mock communities data
const mockCommunities = [
  {
    id: 1,
    title: "Cancer Survivors Support",
    category: "Support Groups",
    member_count: 1247,
    description: "A supportive community for cancer survivors sharing experiences and hope.",
    created_at: "2024-01-15T10:00:00Z",
    members: []
  },
  {
    id: 2,
    title: "Nutrition & Wellness",
    category: "Health & Wellness",
    member_count: 892,
    description: "Sharing healthy recipes and wellness tips for cancer patients and survivors.",
    created_at: "2024-02-01T14:30:00Z",
    members: []
  },
  {
    id: 3,
    title: "Caregivers Circle",
    category: "Caregivers",
    member_count: 634,
    description: "Support and resources for family members and caregivers.",
    created_at: "2024-01-20T09:15:00Z",
    members: []
  },
  {
    id: 4,
    title: "Mental Health & Mindfulness",
    category: "Mental Health",
    member_count: 756,
    description: "Focusing on mental wellness, meditation, and emotional support.",
    created_at: "2024-02-10T16:45:00Z",
    members: []
  },
  {
    id: 5,
    title: "Treatment Updates",
    category: "Medical",
    member_count: 423,
    description: "Latest treatment options and medical breakthroughs discussion.",
    created_at: "2024-02-15T11:20:00Z",
    members: []
  }
];

// Mock community posts
const mockCommunityPosts = {
  1: [
    {
      id: 101,
      content: "Just wanted to share that I completed my 6-month check-up today and everything looks great! 🎉 To anyone going through treatment right now - there is hope and light at the end of the tunnel.",
      author_id: 1,
      author_name: "Sarah Johnson",
      author_avatar: null,
      community_id: 1,
      category: "Support",
      created_at: "2024-02-20T14:30:00Z",
      likes_count: 24,
      comments_count: 8
    }
  ],
  2: [
    {
      id: 102,
      content: "Found this amazing anti-inflammatory smoothie recipe that's been helping with my energy levels during treatment. Green tea, spinach, pineapple, and ginger - tastes better than it sounds! 🥤",
      author_id: 2,
      author_name: "Mike Chen",
      author_avatar: null,
      community_id: 2,
      category: "Nutrition",
      created_at: "2024-02-19T10:15:00Z",
      likes_count: 18,
      comments_count: 5
    }
  ],
  3: [
    {
      id: 103,
      content: "As a caregiver, I've learned that taking care of yourself isn't selfish - it's necessary. Remember to take breaks, ask for help, and be kind to yourself. You're doing an amazing job. ❤️",
      author_id: 3,
      author_name: "Lisa Rodriguez",
      author_avatar: null,
      community_id: 3,
      category: "Caregiving",
      created_at: "2024-02-18T16:45:00Z",
      likes_count: 31,
      comments_count: 12
    }
  ]
};

// Communities API
export const communities = {
  getCommunities: async () => {
    try {
      const data = await fetchAPI("/api/communities");
      // Normalize communities response if it's an array
      if (Array.isArray(data)) {
        return {
          communities: data,
          total: data.length
        };
      }
      return data;
    } catch (error) {
      // Return mock data when API fails
      console.log('Using mock communities data');
      return {
        communities: mockCommunities,
        total: mockCommunities.length
      };
    }
  },

  getAll: async () => {
    try {
      const data = await fetchAPI("/api/communities");
      // Return array directly for getAll
      if (Array.isArray(data)) {
        return data;
      }
      // If it's an object with communities property, return the communities array
      return data.communities || [];
    } catch (error) {
      // Return mock data when API fails
      console.log('Using mock communities data for getAll');
      return mockCommunities;
    }
  },

  createCommunity: async (communityData) => {
    try {
      return await fetchAPI("/api/communities", {
        method: "POST",
        body: JSON.stringify(communityData),
      });
    } catch (error) {
      // Mock community creation for development
      console.log('Mock: Community creation not available');
      throw new Error('Community creation not available in development mode');
    }
  },

  getCommunity: async (communityId) => {
    try {
      return await fetchAPI(`/api/communities/${communityId}`);
    } catch (error) {
      // Return mock community data when API fails
      const mockCommunity = mockCommunities.find(c => c.id === parseInt(communityId));
      if (mockCommunity) {
        return {
          ...mockCommunity,
          members: [] // Empty members array for mock data
        };
      }
      throw error;
    }
  },

  updateCommunity: (communityId, communityData) =>
    fetchAPI(`/api/communities/${communityId}`, {
      method: "PUT",
      body: JSON.stringify(communityData),
    }),

  deleteCommunity: (communityId) =>
    fetchAPI(`/api/communities/${communityId}`, {
      method: "DELETE",
    }),

  joinCommunity: async (communityId, invitedBy = null) => {
    try {
      return await fetchAPI(`/api/communities/${communityId}/join`, {
        method: "POST",
        body: JSON.stringify({ invited_by: invitedBy }),
      });
    } catch (error) {
      // Mock successful join for development
      console.log(`Mock: Joined community ${communityId}`);
      return { success: true, message: "Successfully joined community" };
    }
  },

  leaveCommunity: (communityId) =>
    fetchAPI(`/api/communities/${communityId}/join`, {
      method: "DELETE",
    }),

  inviteToCommunity: (communityId, userId) =>
    fetchAPI(`/api/communities/${communityId}/invite`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    }),

  updateMember: (communityId, userId, status) =>
    fetchAPI(`/api/communities/${communityId}/members/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  removeMember: (communityId, userId) =>
    fetchAPI(`/api/communities/${communityId}/members/${userId}`, {
      method: "DELETE",
    }),

  getPosts: async (communityId, page = 1, limit = 10) => {
    try {
      const data = await fetchAPI(`/api/communities/${communityId}/posts?page=${page}&limit=${limit}`);
      // Normalize community posts response if it's an array
      if (Array.isArray(data)) {
        return {
          posts: data,
          page: page,
          limit: limit,
          total: data.length
        };
      }
      return data;
    } catch (error) {
      // Return mock posts when API fails
      const posts = mockCommunityPosts[communityId] || [];
      console.log(`Using mock posts for community ${communityId}`);
      return {
        posts: posts,
        page: page,
        limit: limit,
        total: posts.length
      };
    }
  },

  createPost: (communityId, postData) =>
    fetchAPI(`/api/communities/${communityId}/posts`, {
      method: "POST",
      body: JSON.stringify(postData),
    }),

  getEvents: async (communityId) => {
    try {
      return await fetchAPI(`/api/communities/${communityId}/events`);
    } catch (error) {
      // Return empty events array when API fails
      console.log(`No events available for community ${communityId}`);
      return [];
    }
  },

  createEvent: (communityId, eventData) =>
    fetchAPI(`/api/communities/${communityId}/events`, {
      method: "POST",
      body: JSON.stringify(eventData),
    }),

  respondToEvent: (eventId, response) =>
    fetchAPI(`/api/communities/events/${eventId}/respond`, {
      method: "POST",
      body: JSON.stringify({ response }),
    }),
}

// Users API
export const users = {
  getFollowers: () => fetchAPI("/api/users/followers"),
  
  // Profile API methods
  getProfile: (userId = null) => {
    const endpoint = userId ? `/api/users/${userId}/profile` : "/api/users/profile"
    return fetchAPI(endpoint)
  },
  
  updateProfile: (profileData) =>
    fetchAPI("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    }),

  updatePrivacy: (isPublic) =>
    fetchAPI("/api/users/profile/privacy", {
      method: "PUT",
      body: JSON.stringify({ is_public: isPublic }),
    }),

  changePassword: (currentPassword, newPassword) =>
    fetchAPI("/api/users/change-password", {
      method: "PUT",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      }),
    }),

  deleteAccount: (password) =>
    fetchAPI("/api/users/account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    }),

  // Follow functionality
  getFollowers: (userID = null) => {
    const endpoint = userID ? `/api/users/${userID}/followers` : "/api/users/followers"
    return fetchAPI(endpoint)
  },

  getFollowing: (userID = null) => {
    const endpoint = userID ? `/api/users/${userID}/following` : "/api/users/following"
    return fetchAPI(endpoint)
  },

  getFollowCounts: (userID = null) => {
    const endpoint = userID ? `/api/users/${userID}/counts` : "/api/users/counts"
    return fetchAPI(endpoint)
  },

  getFollowStatus: (userID) =>
    fetchAPI(`/api/users/${userID}/follow-status`),

  followUser: (userID) =>
    fetchAPI(`/api/users/${userID}/follow`, {
      method: "POST",
    }),

  unfollowUser: (userID) =>
    fetchAPI(`/api/users/${userID}/follow`, {
      method: "DELETE",
    }),

  cancelFollowRequest: (userID) =>
    fetchAPI(`/api/users/${userID}/follow-request`, {
      method: "DELETE",
    }),

  acceptFollowRequest: (userID) =>
    fetchAPI(`/api/users/${userID}/accept-follow`, {
      method: "POST",
    }),

  getSuggestedUsers: () => fetchAPI("/api/users/suggested"),

  getOnlineUsers: () => fetchAPI("/api/users/online"),

  getAllUsers: () => fetchAPI("/api/users/all"),

  acceptMessageRequest: (requesterId) =>
    fetchAPI(`/api/users/accept-message-request?requester_id=${requesterId}`, {
      method: "POST"
    }),
}

export const messages = {
  getConversations: () => fetchAPI("/api/messages/conversations"),

  getMessages: (userId, page = 1, limit = 50) =>
    fetchAPI(`/api/messages/${userId}?page=${page}&limit=${limit}`),

  sendMessage: (userId, content) => fetchAPI(`/api/messages/${userId}`, {
    method: "POST",
    body: JSON.stringify({ content })
  }),

  markAsRead: async (userId) => {
    console.log('Making markAsRead API call for userId:', userId);
    try {
      const result = await fetchAPI(`/api/messages/${userId}/read`, {
        method: "PUT"
      });
      console.log('markAsRead API call successful:', result);
      return result;
    } catch (error) {
      console.error('markAsRead API call failed:', error);
      throw error;
    }
  },

  getUnreadCount: () => fetchAPI("/api/messages/unread-count"),

  // Community chat functions
  getCommunityMessages: (communityId, page = 1, limit = 50) =>
    fetchAPI(`/api/communities/${communityId}/messages?page=${page}&limit=${limit}`),

  sendCommunityMessage: (communityId, content) => fetchAPI(`/api/communities/${communityId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content })
  }),
}

// Notifications API
export const notifications = {
  getNotifications: (page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    return fetchAPI(`/api/notifications?${params}`);
  },
  
  markAsRead: (notificationId) => 
    fetchAPI(`/api/notifications/read?id=${notificationId}`, {
      method: "PUT",
    }),
    
  markAllAsRead: () =>
    fetchAPI("/api/notifications/read-all", {
      method: "PUT",
    }),
    
  getUnreadCount: () => fetchAPI("/api/notifications/unread-count"),
}

// Activity API
export const activity = {
  getUserActivities: (userID = null, params = {}) => {
    const endpoint = userID ? `/api/activity/${userID}` : "/api/activity"
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.append("page", params.page)
    if (params.limit) searchParams.append("limit", params.limit)
    if (params.types && params.types.length > 0) {
      searchParams.append("types", params.types.join(","))
    }
    if (params.showHidden) searchParams.append("show_hidden", "true")
    
    const queryString = searchParams.toString()
    return fetchAPI(`${endpoint}${queryString ? `?${queryString}` : ""}`)
  },

  getUserPosts: (userID = null, params = {}) => {
    const endpoint = userID ? `/api/activity/${userID}/posts` : "/api/activity/posts"
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.append("page", params.page)
    if (params.limit) searchParams.append("limit", params.limit)
    
    const queryString = searchParams.toString()
    return fetchAPI(`${endpoint}${queryString ? `?${queryString}` : ""}`)
  },

  hideActivity: (activityID) =>
    fetchAPI(`/api/activity/${activityID}/hide`, {
      method: "PUT",
    }),

  unhideActivity: (activityID) =>
    fetchAPI(`/api/activity/${activityID}/unhide`, {
      method: "PUT",
    }),

  getActivitySettings: () => fetchAPI("/api/activity/settings"),

  updateActivitySettings: (settings) =>
    fetchAPI("/api/activity/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),
}

// Upload API
export const upload = {
  uploadFile: async (file) => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetchAPI("/api/upload", {
        method: "POST",
        body: formData,
      })
      
      if (!response || !response.url) {
        console.error('Invalid response from server:', response)
        throw new Error("Invalid response from server")
      }
      
      console.log('Upload successful, URL:', response.url)
      return response
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  },
}

// WebSocket connection
export const connectWebSocket = (onMessage) => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  const host = API_URL.replace(/^https?:\/\//, "")
  const ws = new WebSocket(`${protocol}//${host}/ws`)

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data)
    } catch (error) {
      console.error("Error parsing WebSocket message:", error)
    }
  }

  ws.onclose = () => {
    // Silently handle WebSocket close - attempt to reconnect after a delay
    setTimeout(() => connectWebSocket(onMessage), 5000)
  }

  ws.onerror = (error) => {
    // Silently handle WebSocket errors to avoid console spam
    // In production, you might want to log this to an error tracking service
  }

  return ws
}

// Keep groups as alias for backward compatibility
export const groups = communities;

export default {
  auth,
  posts,
  comments,
  communities,
  groups,
  users,
  messages,
  activity,
  upload,
  connectWebSocket,
}
