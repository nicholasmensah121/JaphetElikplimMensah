document.addEventListener('DOMContentLoaded', async () => {
  const contactMessagesContainer = document.getElementById('contactMessagesContainer');
  const messageDetailsElement = document.getElementById('messageDetails');
  const totalMessagesCount = document.getElementById('totalMessagesCount');
  const activeAdminsCount = document.getElementById('activeAdmins');

  // SECURITY: Fetch user from server instead of localStorage
  let user = null;
  try {
    if (apiService && apiService.hasStoredToken()) {
      const profile = await apiService.getProfile();
      user = profile.user;
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
  }

  if (!user || user.role !== 'admin') {
    toast.error('Admin access is required to view this page.');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1400);
    return;
  }

  activeAdminsCount.textContent = '1';

  const state = {
    messages: [],
    selectedMessage: null,
  };

  const loadMessages = async () => {
    try {
      const response = await apiService.getContactMessages();
      state.messages = response.data || [];
      renderMessages();
    } catch (error) {
      const message = errorHandler.getErrorMessage(error);
      toast.error(message);
      if (message.toLowerCase().includes('unauthorized')) {
        window.location.href = 'login.html';
      }
      contactMessagesContainer.innerHTML = '<p>Unable to load messages.</p>';
    }
  };

  const renderMessages = () => {
    totalMessagesCount.textContent = state.messages.length;

    if (state.messages.length === 0) {
      contactMessagesContainer.innerHTML = '<p>No contact messages have been submitted yet.</p>';
      messageDetailsElement.classList.add('empty');
      messageDetailsElement.innerHTML = 'Select a message to view the full details.';
      return;
    }

    contactMessagesContainer.innerHTML = '';
    state.messages.forEach((message) => {
      const card = document.createElement('div');
      card.className = 'contact-card';
      card.innerHTML = `
        <div>
          <div class="contact-card-header">
            <div>
              <p class="contact-card-title">${sanitizeText(message.subject)}</p>
              <p class="contact-card-meta">${sanitizeText(message.name)} • ${sanitizeText(message.email)}</p>
            </div>
            <div class="contact-card-actions">
              <button class="btn btn-small btn-secondary view-message" type="button">View</button>
              <button class="btn btn-small btn-danger delete-message" type="button">Delete</button>
            </div>
          </div>
          <p class="contact-card-meta">${new Date(message.createdAt).toLocaleString()}</p>
          <p>${truncateText(message.message, 120)}</p>
        </div>
      `;

      const viewButton = card.querySelector('.view-message');
      const deleteButton = card.querySelector('.delete-message');

      viewButton.addEventListener('click', () => {
        state.selectedMessage = message;
        renderMessageDetails(message);
      });

      deleteButton.addEventListener('click', async () => {
        const confirmed = window.confirm('Delete this contact message? This cannot be undone.');
        if (!confirmed) {
          return;
        }

        try {
          await apiService.deleteContactMessage(message._id || message.id);
          state.messages = state.messages.filter((item) => item._id !== message._id);
          if (state.selectedMessage && state.selectedMessage._id === message._id) {
            state.selectedMessage = null;
            messageDetailsElement.classList.add('empty');
            messageDetailsElement.innerHTML = 'Select a message to view the full details.';
          }
          renderMessages();
          toast.success('Message deleted successfully');
        } catch (error) {
          toast.error(errorHandler.getErrorMessage(error));
        }
      });

      contactMessagesContainer.appendChild(card);
    });

    if (!state.selectedMessage && state.messages.length > 0) {
      state.selectedMessage = state.messages[0];
      renderMessageDetails(state.selectedMessage);
    }
  };

  const renderMessageDetails = (message) => {
    messageDetailsElement.classList.remove('empty');
    messageDetailsElement.innerHTML = `
      <dl>
        <dt>Name</dt>
        <dd>${sanitizeText(message.name)}</dd>
        <dt>Email</dt>
        <dd>${sanitizeText(message.email)}</dd>
        <dt>Phone</dt>
        <dd>${sanitizeText(message.phone || 'N/A')}</dd>
        <dt>Subject</dt>
        <dd>${sanitizeText(message.subject)}</dd>
        <dt>Submitted</dt>
        <dd>${new Date(message.createdAt).toLocaleString()}</dd>
        <dt>Message</dt>
        <dd>${sanitizeText(message.message).replace(/\n/g, '<br>')}</dd>
        <dt>Newsletter</dt>
        <dd>${message.newsletter ? 'Yes' : 'No'}</dd>
      </dl>
    `;
  };

  const truncateText = (text, length) => {
    if (!text) return '';
    return text.length > length ? `${text.substring(0, length)}...` : text;
  };

  const sanitizeText = (value) => {
    if (typeof value !== 'string') {
      return String(value || '');
    }
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  };

  await loadMessages();
});
