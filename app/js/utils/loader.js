USER = new User();

const showElements = userStatus => {
  const selector = userStatus === 'anonymous' ? '.not-logged-element' : '.logged-element';
  const els = document.querySelectorAll(selector);
  els.forEach(el => el.classList.remove('d-none'));
  if (userStatus === 'admin') {
    const adminEls = document.querySelectorAll('admin-element');
    adminEls.forEach(el => el.classList.remove('d-none'));
  }
};


const load = async () => {

  const user = await USER.getStatus();

  getText('/views/template/navbar.html').then(async template => {

    const navbarContainer = document.getElementById('navbar');
  
    if (!navbarContainer) {
      return;
    }
    
    showElements(user.status);

    const bodyClass = user.status === 'anonymous' ? 'not-logged' : 'logged';
    document.body.classList.add(bodyClass);
  
    // redirect to verify account page if necessary
    if (user.status !== 'anonymous' && !user.isVerified() && window.location.pathname !== '/verify') {
      window.location.href = '/verify';
    }
    
    // TODO - use user status to render navbar
    const out = Mustache.render(template, { logged: user.isLogged(), admin: user.isAdmin(), name: user.getName(), email: user.getEmail() });
    navbarContainer.innerHTML = out;
  
    $('.ui.dropdown').dropdown();
  
    $('.ui.toggle.button').click(() => $('.ui.vertical.menu').toggle("250", "linear"));
  
    // logout
    const logoutBtns = document.querySelectorAll('.logout-button');
    logoutBtns.forEach(btn => btn.addEventListener('click', e => user.logout()));
  
    // go to new job
    const newJobBtns = document.querySelectorAll('.new-job-button');
    newJobBtns.forEach(btn => btn.addEventListener('click', e => window.location.href = '/new-job'));
  
    // go to profile
    const profileBtns = document.querySelectorAll('.profile-button');
    profileBtns.forEach(btn => btn.addEventListener('click', e => window.location.href = '/profile'));
  });

  getText('/views/template/footer.html').then(template => {
    const footerContainer = document.getElementById('footer');
  
    if (!footerContainer) {
      return;
    }
  
    const out = Mustache.render(template, { currentYear: new Date().getFullYear(), admin: user.isAdmin() });
    footerContainer.innerHTML = out;  
  });
};

// go!
load();