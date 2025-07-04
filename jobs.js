// Jobs module
const jobs = {
  // Initialize jobs module
  async init() {
    await this.loadJobs();
    await this.loadApplications();
    this.setupEventListeners();
    await this.createSampleJobs();
  },

  // Load jobs from Supabase
  async loadJobs() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('posted_at', { ascending: false });
      
      if (error) throw error;
      this.jobs = data || [];
    } catch (error) {
      console.error('Error loading jobs:', error);
      this.jobs = [];
    }
  },

  // Load applications from Supabase
  async loadApplications() {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('applied_at', { ascending: false });
      
      if (error) throw error;
      this.applications = data || [];
    } catch (error) {
      console.error('Error loading applications:', error);
      this.applications = [];
    }
  },

  // Setup event listeners for job-related forms
  setupEventListeners() {
    const jobSearchForm = document.getElementById('job-search-form');
    const postJobForm = document.getElementById('post-job-form');
    const applicationForm = document.getElementById('application-form');
    const modalCloseBtn = document.getElementById('modal-close');
    const applicationModal = document.getElementById('application-modal');

    if (jobSearchForm) {
      jobSearchForm.addEventListener('submit', (e) => this.handleJobSearch(e));
    }

    if (postJobForm) {
      postJobForm.addEventListener('submit', (e) => this.handlePostJob(e));
    }

    if (applicationForm) {
      applicationForm.addEventListener('submit', (e) => this.handleApplication(e));
    }

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => this.closeApplicationModal());
    }

    if (applicationModal) {
      applicationModal.addEventListener('click', (e) => {
        if (e.target === applicationModal) this.closeApplicationModal();
      });
    }
  },

  // Handle job search form submission
  handleJobSearch(e) {
    e.preventDefault();
    let filtered = this.jobs;
    const keyword = e.target['search-keyword'].value.trim().toLowerCase();
    const location = e.target['search-location'].value.trim().toLowerCase();
    const type = e.target['search-type'].value;

    if (keyword) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(keyword) || 
        job.description.toLowerCase().includes(keyword)
      );
    }
    if (location) {
      filtered = filtered.filter(job => job.location.toLowerCase().includes(location));
    }
    if (type) {
      filtered = filtered.filter(job => job.type === type);
    }
    this.renderJobs(filtered);
  },

  // Handle job posting form submission
  async handlePostJob(e) {
    e.preventDefault();
    if (!auth.currentUser || auth.currentUser.role !== 'employer') return;

    const title = e.target['job-title'].value.trim();
    const location = e.target['job-location'].value.trim();
    const type = e.target['job-type'].value;
    const description = e.target['job-description'].value.trim();

    if (!title || !location || !type || !description) {
      alert('Please fill all job details');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          title,
          company: auth.currentUser.name,
          company_id: auth.currentUser.id,
          location,
          type,
          description
        }])
        .select();

      if (error) throw error;

      await this.loadJobs();
      e.target.reset();
      this.renderPostedJobs();
      alert('Job posted successfully');
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Failed to post job. Please try again.');
    }
  },

  // Handle job application form submission
  async handleApplication(e) {
    e.preventDefault();
    if (!this.jobToApply || !auth.currentUser) return;

    const applicantName = e.target['applicant-name'].value.trim();
    const applicantEmail = e.target['applicant-email'].value.trim();
    const resume = e.target['applicant-resume'].value.trim();

    if (!applicantName || !applicantEmail) {
      alert('Name and email are required.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('applications')
        .insert([{
          job_id: this.jobToApply.id,
          job_title: this.jobToApply.title,
          company: this.jobToApply.company,
          applicant_id: auth.currentUser.id,
          applicant_name: applicantName,
          applicant_email: applicantEmail,
          resume
        }])
        .select();

      if (error) throw error;

      await this.loadApplications();
      alert('Application submitted successfully!');
      this.closeApplicationModal();
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    }
  },

  // Render job listings
  renderJobs(jobsToRender) {
    const jobsListEl = document.getElementById('jobs-list');
    if (!jobsListEl) return;

    if (!jobsToRender) {
      // Default show all jobs ranked by date posted descending
      jobsToRender = this.jobs.slice();
      // For personalization demo: if job seeker, filter jobs by location or role keyword
      if (auth.currentUser && auth.currentUser.role === 'jobseeker') {
        const userLoc = 'remote'; // no location for demo, could enhance
        jobsToRender = jobsToRender.filter(job => 
          job.location.toLowerCase().includes(userLoc) || 
          job.title.toLowerCase().includes('developer') || 
          job.type === 'Full-time'
        );
      }
    }

    jobsListEl.innerHTML = '';

    if (jobsToRender.length === 0) {
      jobsListEl.innerHTML = '<p>No jobs found.</p>';
      return;
    }

    jobsToRender.forEach(job => {
      const card = document.createElement('div');
      card.className = 'job-card';
      card.innerHTML = `
        <div class="job-title">${job.title}</div>
        <div class="job-company">${job.company}</div>
        <div class="job-location">${job.location}</div>
        <div class="job-type">${job.type}</div>
        <div class="job-description">${job.description.length > 140 ? job.description.slice(0,140) + '...' : job.description}</div>
        <button aria-label="Apply for ${job.title} at ${job.company}">Apply</button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        this.openApplicationModal(job);
      });
      jobsListEl.appendChild(card);
    });
  },

  // Render posted jobs for employer
  renderPostedJobs() {
    const postedJobsList = document.getElementById('posted-jobs-list');
    if (!postedJobsList || !auth.currentUser) return;

    const myJobs = this.jobs
      .filter(j => j.company_id === auth.currentUser.id)
      .sort((a,b) => new Date(b.posted_at) - new Date(a.posted_at));

    postedJobsList.innerHTML = '';

    if (myJobs.length === 0) {
      postedJobsList.innerHTML = '<p>You have not posted any jobs yet.</p>';
      return;
    }

    myJobs.forEach(job => {
      const div = document.createElement('div');
      div.className = 'job-card';
      div.innerHTML = `
        <div class="job-title">${job.title}</div>
        <div class="job-location">${job.location}</div>
        <div class="job-type">${job.type}</div>
        <div class="job-description">${job.description.length > 140 ? job.description.slice(0,140) + '...' : job.description}</div>
        <button aria-label="View applications for job ${job.title}">View Applications</button>
      `;
      const btn = div.querySelector('button');
      btn.addEventListener('click', () => {
        this.showApplicationsForJob(job.id);
      });
      postedJobsList.appendChild(div);
    });
  },

  // Open application modal
  openApplicationModal(job) {
    if (!auth.currentUser || auth.currentUser.role !== 'jobseeker') {
      alert('Please login as a Job Seeker to apply.');
      auth.showSection('login');
      return;
    }

    this.jobToApply = job;
    const applicationModal = document.getElementById('application-modal');
    const applicationForm = document.getElementById('application-form');

    if (applicationModal && applicationForm) {
      applicationModal.classList.add('active');
      applicationForm.reset();
      // Prefill user info if available
      applicationForm['applicant-name'].value = auth.currentUser.name || '';
      applicationForm['applicant-email'].value = auth.currentUser.email || '';
      applicationForm['applicant-resume'].value = '';
      applicationForm['applicant-name'].focus();
    }
  },

  // Close application modal
  closeApplicationModal() {
    this.jobToApply = null;
    const applicationModal = document.getElementById('application-modal');
    if (applicationModal) {
      applicationModal.classList.remove('active');
    }
  },

  // Show applications for a specific job
  async showApplicationsForJob(jobId) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId)
        .order('applied_at', { ascending: false });

      if (error) throw error;

      const jobApplications = data || [];
      if (jobApplications.length === 0) {
        alert('No applications for this job yet.');
        return;
      }

      let text = `Applications for Job ID: ${jobId}\n\n`;
      jobApplications.forEach((app, idx) => {
        text += `${idx+1}. ${app.applicant_name} (${app.applicant_email}) - Applied on ${new Date(app.applied_at).toLocaleDateString()}\nResume: ${app.resume || 'N/A'}\n\n`;
      });
      alert(text);
    } catch (error) {
      console.error('Error loading applications:', error);
      alert('Failed to load applications. Please try again.');
    }
  },

  // Create sample jobs for demo
  async createSampleJobs() {
    if (this.jobs.length > 0) return;

    const sampleJobs = [
      {
        title: 'Frontend Developer',
        company: 'Tech Solutions Inc.',
        company_id: 'comp_1',
        location: 'Remote',
        type: 'Full-time',
        description: 'We are looking for a passionate Frontend Developer skilled in modern JavaScript frameworks and responsive design.'
      },
      {
        title: 'Marketing Manager',
        company: 'GrowFast Marketing',
        company_id: 'comp_2',
        location: 'New York, NY',
        type: 'Full-time',
        description: 'Seeking an experienced Marketing Manager to lead campaigns and brand growth in a dynamic environment.'
      },
      {
        title: 'Graphic Designer (Part-time)',
        company: 'Creative Studio',
        company_id: 'comp_3',
        location: 'San Francisco, CA',
        type: 'Part-time',
        description: 'Looking for a creative Graphic Designer to create engaging visuals for our digital campaigns.'
      },
      {
        title: 'Intern: Software Engineer',
        company: 'Innovatech Labs',
        company_id: 'comp_4',
        location: 'Remote',
        type: 'Internship',
        description: 'Join our engineering team for a summer internship program working on exciting new projects.'
      }
    ];

    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert(sampleJobs)
        .select();

      if (error) throw error;
      await this.loadJobs();
    } catch (error) {
      console.error('Error creating sample jobs:', error);
    }
  }
};

// Initialize jobs module when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  jobs.init();
});

// Export jobs module
window.jobs = jobs; 