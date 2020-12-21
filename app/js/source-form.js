class SourceForm {
  static goToJobPage() {
    window.location.href = `/job/${this.options.job_alias}`
  }

  static reloadPage() {
    location.reload();
  }

  static setup(options = {}) {
    
    // OPTIONS
    this.options = options;
    if (!this.options.job_id) {
      console.error('[Source Form] job_id not provided - aborting setup');
      return;
    }

    // SKIP BUTTON
    this.skipBtn = document.querySelector('.skip-button');
    if (!this.skipBtn) {
      console.warn('[Source Form] skip button not found');
    } else {
      this.skipBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        this.goToJobPage();
      });
    }

    // BACK BUTTON
    const backBtns = document.querySelectorAll('.back-button');

    if (!backBtns) {
      console.warn('[Source Form] back buttons not found');
    } else {
      backBtns.forEach(btn => btn.addEventListener('click', async e => {
        const { stepcurrent, stepto } = e.target.dataset;
        const action = await startTransition(`.new-job-step.step-${stepcurrent}`);

        if (action !== 'hide') {
          return;
        }

        await startTransition(`.new-job-step.step-${stepto}`);
        const newJobStep = document.getElementById('new-job-step');
        if (newJobStep) newJobStep.innerText = stepto;
      }));
    }

    // FILE TYPE CHECK
    this.fileInput = document.getElementById('jobSourceFileInput');
    if (!this.fileInput) {
      console.error('[Source Form] file input filed not found - aborting setup');
    }

    this.fileInputError = document.querySelector('.file-error');
    if (!this.fileInputError) {
      console.error('[Source Form] file type error message not found - aborting setup');
      return;
    }

    this.uploadButton = document.querySelector('.upload-button');
    if (!this.uploadButton) {
      console.error('[Source Form] upload button not found - aborting setup');
      return;
    }

    this.fileInput.addEventListener('change', e => {
      const fileType = e.target.files[0].type;

      if (fileType !== 'text/csv') {
        this.fileInput.classList.add('wrong');
        this.fileInputError.classList.add('d-block');
        this.uploadButton.classList.add('disabled');
      } else {
        this.fileInput.classList.remove('wrong');
        this.fileInputError.classList.remove('d-block');
        this.uploadButton.classList.remove('disabled');
      }
    }, false);

    // SUBMIT
    this.submitForm = document.querySelector('form.add-source-form');

    if (!this.submitForm) {
      console.error('[Source Form] form not found - aborting setup');
    }

    this.submitForm.addEventListener('submit', e => {
      e.preventDefault();
      this.upload();
    });

    // HELP
    this.buildCsvHelp();
  }

  static async upload() {

    const { job_id } = this.options;

    const source_type = 'csv'; // TEMP - only allow csv

    const file = this.fileInput.files[0];

    if (!file) {
      console.error('[Source Form] no file selected - aborting upload');
    }

    const name = file.name;
    const buffer = await file.arrayBuffer();
    const { path } = await uploadFile(buffer);

    const source_config = {
      path,
      separator: document.querySelector('input[name="job-source-separator"]').value || ',',
      quote: document.querySelector('input[name="job-source-quote"]').value,
      escape: document.querySelector('input[name="job-source-escape"]').value
    };

    this.uploadButton.classList.add('disabled', 'loading');

    if (this.skipBtn) {
      this.skipBtn.classList.add('disabled');
    }

    await createSource({ job_id, source_type, name, source_config });

    this.options.afterUpload === 'redirect' ? this.goToJobPage() : this.reloadPage();
  }

  static async buildCsvHelp() {
    const helpModalContainer = document.querySelector('.csv-help-modal');
    if (!helpModalContainer) {
      console.warn('[Source Form] help modal container not found - aborting help setup');
      return;
    }

    const helpBtn = document.querySelector('.csv-help-button');
    if (!helpBtn) {
      console.warn('[Source Form] help button not found - aborting help setup');
      return;
    }

    const helpModal = await getText('/views/template/csv-help.html');

    helpModalContainer.innerHTML = helpModal;

    helpBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      $('.ui.modal.csv-help-modal').modal('show');
    });

    helpBtn.classList.remove('d-none');
  }
}