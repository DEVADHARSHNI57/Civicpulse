// Import Supabase via CDN for plain JS setup
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ============================================
// 1. SETUP: Initialize Supabase Client
// ============================================
// Replace these with your actual Supabase URL and ANON KEY
// IMPORTANT SECURITY RULE: NEVER put your Service Role Key here.
const SUPABASE_URL = 'REDACTED_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'REDACTED_SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let realtimeChannel = null;

// ============================================
// DOM Elements
// ============================================
const userIdInput = document.getElementById('userId');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const submitBtn = document.getElementById('submitBtn');
const submitMessage = document.getElementById('submitMessage');
const notificationList = document.getElementById('notificationList');
const loadNotificationsBtn = document.getElementById('loadNotificationsBtn');
const badge = document.getElementById('badge');
const bell = document.getElementById('bell');

// ============================================
// 2. COMPLAINT SUBMISSION
// ============================================
async function submitComplaint() {
    const title = titleInput.value;
    const description = descriptionInput.value;

    if (!title || !description) {
        showMessage('Please fill all fields', 'error');
        return;
    }

    try {
        submitBtn.disabled = true;

        // 1. Always fetch the authenticated user directly from Supabase
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
            throw new Error('Not authenticated. Please log in first.');
        }
        const user = authData.user;

        // Generate a mock complaint ID since backend uses String 'CP-XXXX' format
        const complaintId = 'CP-' + Math.floor(Math.random() * 10000);

        // 2. Insert into "complaints" table
        const { error: insertError } = await supabase
            .from('complaints')
            .insert([
                {
                    id: complaintId,
                    user_id: user.id, // Must be the UUID from auth
                    title: title,
                    description: description,
                    status: 'Open',
                    progress: 0,
                    location: 'Mock Location',
                    category: 'General'
                }
            ]);

        if (insertError) throw insertError;

        // 3. Insert notification referencing the new complaint
        await createNotification(user.id, complaintId, title);

        showMessage('Complaint submitted successfully!', 'success');

        // Clear input logic
        titleInput.value = '';
        descriptionInput.value = '';

        // Optional: refresh complaints list
        await fetchComplaints();

    } catch (error) {
        console.error('Error submitting complaint:', error);
        showMessage(error.message, 'error');
        alert(error.message);
    } finally {
        submitBtn.disabled = false;
    }
}

// ============================================
// 2.5 CREATE NOTIFICATION
// ============================================
async function createNotification(userId, complaintId, title) {
    try {
        const { error } = await supabase
            .from('notifications')
            .insert([
                {
                    user_id: userId,
                    complaint_id: complaintId,
                    message: `Your complaint "${title}" has been safely secured. We will review it shortly.`,
                    is_read: false
                }
            ]);

        if (error) throw error;
    } catch (error) {
        console.error('Error creating notification:', error);
        alert('Failed to insert notification: ' + error.message);
    }
}

// ============================================
// 2.6 FETCH COMPLAINTS
// ============================================
async function fetchComplaints() {
    try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) return;

        const { data: complaints, error } = await supabase
            .from('complaints')
            .select('*')
            .eq('user_id', authData.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log('Fetched Complaints:', complaints);
        // Map to DOM here if you have a UI container for complaints
    } catch (error) {
        console.error('Error fetching complaints:', error);
    }
}

// ============================================
// 3. FETCH NOTIFICATIONS
// ============================================
async function fetchNotifications() {
    try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
            throw new Error('Not authenticated. Please log in first.');
        }
        const userId = authData.user.id;

        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        renderNotifications(notifications);
        setupRealtimeSubscription(userId); // Enable realtime listener for this UUID

    } catch (error) {
        console.error('Error fetching notifications:', error);
        alert('Could not fetch notifications: ' + error.message);
    }
}

// ============================================
// 4. REAL-TIME NOTIFICATIONS
// ============================================
function setupRealtimeSubscription(userId) {
    // 1. Clean up existing channel if user switches accounts
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
    }

    // 2. Subscribe to the notifications table
    realtimeChannel = supabase
        .channel('custom-notifications-channel')
        .on(
            'postgres_changes',
            {
                event: '*', // Listen to INSERTs and UPDATEs
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                console.log('Got Real-Time Event!', payload);

                // For simplicity, just refetch the list to ensure accurate sync.
                // In larger apps, you can modify the DOM locally based on the payload.
                fetchNotifications();

                // Visual bell animation if it's a new inserting notification
                if (payload.eventType === 'INSERT') {
                    bell.style.transform = "scale(1.3)";
                    setTimeout(() => bell.style.transform = "scale(1)", 200);
                }
            }
        )
        .subscribe();
}

// ============================================
// 5. MARK AS READ
// ============================================
async function markAsRead(notificationId) {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;

        // Notice we do NOT need to call fetchNotifications() immediately here, 
        // because the UPDATE will trigger our Realtime Listener above and auto-refresh!
        // But doing it here manually guarantees UI feel fast immediately.
        fetchNotifications();

    } catch (error) {
        console.error('Error marking as read:', error);
        alert('Failed to mark as read: ' + error.message);
    }
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================
function renderNotifications(notifications) {
    notificationList.innerHTML = '';
    let unreadCount = 0;

    if (notifications.length === 0) {
        notificationList.innerHTML = '<li>No notifications found.</li>';
    }

    notifications.forEach(notif => {
        if (!notif.is_read) unreadCount++;

        const li = document.createElement('li');
        li.className = `notification-item ${notif.is_read ? 'read' : 'unread'}`;

        const textSpan = document.createElement('span');
        textSpan.textContent = notif.message || 'No message provided.';
        li.appendChild(textSpan);

        if (!notif.is_read) {
            const btn = document.createElement('button');
            btn.className = 'mark-read-btn';
            btn.textContent = 'Mark as Read';
            btn.onclick = () => markAsRead(notif.id);
            li.appendChild(btn);
        }

        notificationList.appendChild(li);
    });

    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function showMessage(msg, type) {
    submitMessage.textContent = msg;
    submitMessage.className = type;
    setTimeout(() => { submitMessage.textContent = ''; }, 4000);
}

// Listeners
submitBtn.addEventListener('click', submitComplaint);
loadNotificationsBtn.addEventListener('click', fetchNotifications);
