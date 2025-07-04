// Navigation module
const nav = {
  // Initialize navigation
  init() {
    this.renderNav();
  },

  // Render navigation based on user state
  renderNav() {
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) return;

    navLinks.innerHTML = '';

    if (!auth.currentUser) {
      // Unauthenticated - show Login & Register buttons
      const loginBtn = document.createElement('button');
      loginBtn.textContent = 'Login';
      loginBtn.onclick = () => {
        auth.showSection('login');
      };

      const registerBtn = document.createElement('button');
      registerBtn.textContent = 'Register';
      registerBtn.onclick = () => {
        auth.showSection('register');
      };

      navLinks.appendChild(loginBtn);
      navLinks.appendChild(registerBtn);
    } else {
      // Authenticated
      if (auth.currentUser.role === 'employer') {
        const dashboardBtn = document.createElement('button');
        dashboardBtn.textContent = 'Dashboard';
        dashboardBtn.onclick = () => {
          auth.showSection('employerDashboard');
          window.jobs.renderPostedJobs();
        };
        navLinks.appendChild(dashboardBtn);
      } else {
        // Job seeker
        const searchBtn = document.createElement('button');
        searchBtn.textContent = 'Job Search';
        searchBtn.onclick = () => {
          auth.showSection('jobSearch');
          window.jobs.renderJobs();
        };
        navLinks.appendChild(searchBtn);

        const applicationsBtn = document.createElement('button');
        applicationsBtn.textContent = 'My Applications';
        applicationsBtn.onclick = () => {
          auth.showSection('applications');
          this.renderApplications();
        };
        navLinks.appendChild(applicationsBtn);
      }

      const logoutBtn = document.createElement('button');
      logoutBtn.textContent = 'Logout';
      logoutBtn.onclick = () => {
        auth.logout();
      };
      navLinks.appendChild(logoutBtn);
    }
  },

  // Render job seeker's applications
  renderApplications() {
    const applicationsList = document.getElementById('applications-list');
    if (!applicationsList || !auth.currentUser || auth.currentUser.role !== 'jobseeker') {
      return;
    }

    applicationsList.innerHTML = '';

    let myApps = window.jobs.applications.filter(app => app.applicantId === auth.currentUser.id);
    if (myApps.length === 0) {
      applicationsList.innerHTML = '<p>You have not applied for any jobs yet.</p>';
      return;
    }

    // Sort by newest first
    myApps = myApps.sort((a,b) => b.appliedAt - a.appliedAt);
    myApps.forEach(app => {
      const div = document.createElement('div');
      div.className = 'job-card';
      div.innerHTML = `
        <div class="job-title">${app.jobTitle}</div>
        <div class="job-company">${app.company}</div>
        <div class="job-description">
          Applied on: ${new Date(app.appliedAt).toLocaleDateString()}<br />
          Resume: ${app.resume ? `<a href="${app.resume}" target="_blank" rel="noopener">View</a>` : 'N/A'}
        </div>
      `;
      applicationsList.appendChild(div);
    });
  }
};

// Initialize navigation module when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  nav.init();
});

// Export navigation module
window.nav = nav; 