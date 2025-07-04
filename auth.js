// Auth module
const auth = {
  // Initialize auth module
  async init() {
    await this.loadUsers();
    await this.checkSession();
    this.setupEventListeners();
  },

  // Load users from Supabase
  async loadUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      this.users = data || [];
    } catch (error) {
      console.error('Error loading users:', error);
      this.users = [];
    }
  },

  // Check for existing session
  async checkSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (userError) throw userError;
        
        if (user) {
          this.currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          };
          
          if (this.currentUser.role === 'employer') {
            this.showSection('employerDashboard');
            jobs.renderPostedJobs();
          } else {
            this.showSection('jobSearch');
            jobs.renderJobs();
          }
          
          nav.renderNav();
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
      this.currentUser = null;
    }
  },

  // Setup event listeners for auth forms
  setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toRegisterLink = document.getElementById('to-register');
    const toLoginLink = document.getElementById('to-login');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    if (toRegisterLink) {
      toRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showSection('register');
      });
    }

    if (toLoginLink) {
      toLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showSection('login');
      });
    }
  },

  // Handle login form submission
  async handleLogin(e) {
    e.preventDefault();
    const email = e.target['email'].value.trim().toLowerCase();
    const password = e.target['password'].value.trim();

    if (!email || !password) {
      alert('Please enter email and password.');
      return;
    }

    try {
      // Sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // Get user details from our users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      // Set current user
      this.currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      // Reset form and show appropriate section
      e.target.reset();
      if (this.currentUser.role === 'employer') {
        this.showSection('employerDashboard');
        jobs.renderPostedJobs();
      } else {
        this.showSection('jobSearch');
        jobs.renderJobs();
      }

      // Update navigation
      nav.renderNav();
    } catch (error) {
      console.error('Login error:', error);
      alert('Invalid email or password.');
    }
  },

  // Handle register form submission
  async handleRegister(e) {
    e.preventDefault();
    const name = e.target['name'].value.trim();
    const email = e.target['email'].value.trim().toLowerCase();
    const password = e.target['password'].value.trim();
    const role = e.target['role'].value;

    if (!name || !email || !password || !role) {
      alert('Please fill all required fields.');
      return;
    }

    try {
      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser) {
        alert('Email already registered.');
        return;
      }

      // Create new user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      });

      if (authError) throw authError;

      // Create new user in our users table
      const newUser = {
        id: authData.user.id,
        name,
        email,
        password,
        role,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('users')
        .insert([newUser]);

      if (insertError) throw insertError;

      // Reload users
      await this.loadUsers();

      alert('Registration successful. Please log in.');
      e.target.reset();
      this.showSection('login');
    } catch (error) {
      console.error('Registration error:', error);
      alert('An error occurred during registration. Please try again.');
    }
  },

  // Logout
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      this.currentUser = null;
      this.showSection('login');
      nav.renderNav();
    } catch (error) {
      console.error('Logout error:', error);
      alert('An error occurred during logout. Please try again.');
    }
  },

  // Show section
  showSection(key) {
    const sections = {
      login: document.getElementById('login-section'),
      register: document.getElementById('register-section'),
      jobSearch: document.getElementById('job-search-section'),
      employerDashboard: document.getElementById('employer-dashboard-section'),
      applications: document.getElementById('job-applications-section')
    };

    Object.keys(sections).forEach(k => {
      sections[k].classList.toggle('active', k === key);
    });
  }
};

// Initialize auth module when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  auth.init();
});

// Export auth module
window.auth = auth; 