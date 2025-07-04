// Storage module
const storage = {
  // Storage keys
  STORAGE_KEYS: {
    USERS: 'users',
    JOBS: 'jobs',
    APPLICATIONS: 'applications',
    SESSION: 'session'
  },

  // Save data to Supabase
  async saveToStorage(key, data) {
    try {
      switch (key) {
        case this.STORAGE_KEYS.USERS:
          // For users, we'll insert each user individually
          for (const user of data) {
            const { error } = await supabase
              .from('users')
              .upsert({
                id: user.id,
                name: user.name,
                email: user.email,
                password: user.password,
                role: user.role
              });
            if (error) throw error;
          }
          break;
        case this.STORAGE_KEYS.JOBS:
          // For jobs, we'll insert each job individually
          for (const job of data) {
            const { error } = await supabase
              .from('jobs')
              .upsert({
                id: job.id,
                title: job.title,
                company: job.company,
                company_id: job.company_id,
                location: job.location,
                type: job.type,
                description: job.description,
                posted_at: job.posted_at
              });
            if (error) throw error;
          }
          break;
        case this.STORAGE_KEYS.APPLICATIONS:
          // For applications, we'll insert each application individually
          for (const app of data) {
            const { error } = await supabase
              .from('applications')
              .upsert({
                id: app.id,
                job_id: app.job_id,
                job_title: app.job_title,
                company: app.company,
                applicant_id: app.applicant_id,
                applicant_name: app.applicant_name,
                applicant_email: app.applicant_email,
                resume: app.resume,
                applied_at: app.applied_at
              });
            if (error) throw error;
          }
          break;
        case this.STORAGE_KEYS.SESSION:
          // For session, we'll store in localStorage as it's temporary
          localStorage.setItem(key, JSON.stringify(data));
          break;
      }
    } catch (error) {
      console.error(`Error saving to ${key}:`, error);
      throw error;
    }
  },

  // Get data from Supabase
  async getFromStorage(key) {
    try {
      switch (key) {
        case this.STORAGE_KEYS.USERS:
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*');
          if (usersError) throw usersError;
          return users || [];
        case this.STORAGE_KEYS.JOBS:
          const { data: jobs, error: jobsError } = await supabase
            .from('jobs')
            .select('*')
            .order('posted_at', { ascending: false });
          if (jobsError) throw jobsError;
          return jobs || [];
        case this.STORAGE_KEYS.APPLICATIONS:
          const { data: applications, error: appsError } = await supabase
            .from('applications')
            .select('*')
            .order('applied_at', { ascending: false });
          if (appsError) throw appsError;
          return applications || [];
        case this.STORAGE_KEYS.SESSION:
          // For session, we'll get from localStorage as it's temporary
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
      }
    } catch (error) {
      console.error(`Error getting from ${key}:`, error);
      return [];
    }
  },

  // Get current session user
  async getSessionUser() {
    return this.getFromStorage(this.STORAGE_KEYS.SESSION);
  },

  // Set current session user
  async setSessionUser(user) {
    await this.saveToStorage(this.STORAGE_KEYS.SESSION, user);
  },

  // Clear session
  clearSession() {
    localStorage.removeItem(this.STORAGE_KEYS.SESSION);
  }
};

// Export storage module
window.storage = storage; 