const init = async () => {
  const user = await USER.getStatus();
  
  const template = await getText('/views/template/profile-body.html');

  const content = Mustache.render(template, { admin: user.isAdmin(), name: user.getName(), email: user.getEmail() });

  const profileContainer = document.getElementById('profile-data');
  if (!profileContainer) {
    return;
  }

  profileContainer.innerHTML = content;

  // logout 
  const logoutButton = document.querySelector('.bottom-logout-button');
  logoutButton.addEventListener('click', e => {
    toggleLoading(e.target);
    user.logout()
  });

  const action = await startTransition('.profile-placeholder');

  if (action !== 'hide') {
    return;
  }

  startTransition('#profile-data');
};

// go!
init();