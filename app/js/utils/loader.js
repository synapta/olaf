getText('/views/template/navbar.html').then(template => {
  const navbarContainer = document.getElementById('navbar');
  if (navbarContainer) {
    navbarContainer.innerHTML = template;
  };
});

getText('/views/template/footer.html').then(template => {
  const footerContainer = document.getElementById('footer');
  if (footerContainer) {
    footerContainer.innerHTML = template;
  };
});

