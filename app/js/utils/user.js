class User {

  constructor() {
    this.status = 'pending';
    this.user_data = {};
    this.getStatus();
  }

  getStatus() {
    return new Promise((resolve, reject) => {
      if (this.status !== 'pending') {
        // already have status
        return resolve(this);
      }

      // ask status to API
      getJSON('/api/v2/user')
        .then(user => {
          if (user) {
            this.user_data = user;
            this.status = user.role;
          } else {
            this.user_data = {};
            this.status = 'anonymous';
          }
          resolve(this);
        }).catch(err => {
          this.user_data = {};
          this.status = 'anonymous';
          reject(this);
        });
    });
  }

  logout() {
    return new Promise((resolve, reject) => {
      this.status = 'pending';
      getJSON('/api/v2/user/logout')
        .then(res => {
          this.getStatus()
            .then(user => resolve({...user, redirect: res.redirect }))
            .catch(err => reject(err));
        }).catch(err => reject(err));
    });
  }

  login(data) {
    return new Promise((resolve, reject) => {
      this.status = 'pending';
      postJSON('/api/v2/user/login', data)
        .then(res => {
          this.getStatus()
            .then(user => resolve({...user, redirect: res.redirect }))
            .catch(err => reject(err));
        }).catch(err => reject(err));
    });
  }

  signup(data) {
    return new Promise((resolve, reject) => {
      this.status = 'pending';
      postJSON('/api/v2/user/signup', data)
        .then(res => {
          this.getStatus()
            .then(user => resolve({...user, redirect: res.redirect }))
            .catch(err => reject(err));
        }).catch(err => {
          reject(err);
        });
    });
  }

  getUserData() {
    return this.user_data;
  }

  isLogged() {
    return this.status !== 'anonymous';
  }

  isAdmin() {
    return this.user_data.role === 'admin';
  }

}