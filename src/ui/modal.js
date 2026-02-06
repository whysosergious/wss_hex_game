class Modal {
    constructor(elementId, closeButtonId, contentElementId) {
        this.modalElement = document.getElementById(elementId);
        this.closeButton = document.getElementById(closeButtonId);
        this.contentElement = document.getElementById(contentElementId);

        if (!this.modalElement || !this.closeButton || !this.contentElement) {
            console.error("Modal elements not found:", { elementId, closeButtonId, contentElementId });
            return;
        }

        this.closeButton.addEventListener('click', () => this.hide());
    }

    show(content = '') {
        this.contentElement.textContent = content;
        this.modalElement.classList.remove('hidden');
        this.modalElement.style.display = 'block';
    }

    hide() {
        this.modalElement.classList.add('hidden');
        this.modalElement.style.display = 'none';
        this.contentElement.textContent = ''; // Clear content on hide
    }

    setContent(content) {
        this.contentElement.textContent = content;
    }
}

export default Modal;
