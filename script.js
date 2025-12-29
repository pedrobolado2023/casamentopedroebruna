document.addEventListener('DOMContentLoaded', () => {

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Configuration
    const EMAIL_TARGET = "https://formsubmit.co/ajax/pedrohenriquebonfim156@gmail.com";
    const SHEETDB_URL = "https://sheetdb.io/api/v1/1s3fjdvm70pve";

    // Load Gift Status on Start
    fetchGiftStatus();

    // RSVP Form Handling
    const rsvpForm = document.getElementById('rsvp-form');
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = rsvpForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;

            submitBtn.innerText = 'Enviando...';
            submitBtn.disabled = true;

            const formData = new FormData(rsvpForm);

            // Add custom subject
            formData.append("_subject", "Nova Confirmação de Presença - Casamento");
            formData.append("_template", "table");
            formData.append("_captcha", "false");

            fetch(EMAIL_TARGET, {
                method: "POST",
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    showToast("Obrigado! Sua presença foi confirmada com sucesso.");
                    rsvpForm.reset();
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast("Houve um erro ao enviar. Por favor, tente novamente.");
                })
                .finally(() => {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                });
        });
    }

    // Modal Handling
    const modal = document.getElementById('gift-modal');
    const closeModal = document.querySelector('.close-modal');
    const giftForm = document.getElementById('gift-form');

    // Close Modal Events
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Gift Form Submission (Email + SheetDB)
    if (giftForm) {
        giftForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById('confirm-gift-btn');
            const originalText = submitBtn.innerText;

            const giftId = document.getElementById('gift-item').dataset.id; // We need to store ID here
            const giftName = document.getElementById('gift-item').value;
            const buyerName = document.getElementById('gift-name').value;
            const buyerPhone = document.getElementById('gift-phone').value;

            submitBtn.innerText = 'Confirmando...';
            submitBtn.disabled = true;

            const formData = new FormData(giftForm);

            // 1. Prepare SheetDB Update (PATCH)
            const sheetUpdate = fetch(`${SHEETDB_URL}/id/${giftId}`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: {
                        status: 'indisponivel',
                        comprador_nome: buyerName,
                        comprador_telefone: buyerPhone
                    }
                })
            });

            // 2. Send Email
            const emailSend = fetch(EMAIL_TARGET, {
                method: "POST",
                body: formData
            });

            // Execute both
            Promise.all([sheetUpdate, emailSend])
                .then(([sheetRes, emailRes]) => {
                    modal.classList.remove('active');
                    showToast(`Maravilha! Você marcou o presente: ${giftName}. Obrigado!`);
                    giftForm.reset();

                    // Update UI immediately without reload
                    markGiftAsTaken(giftId);
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast("Erro ao confirmar. Verifique se já não foi escolhido.");
                })
                .finally(() => {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                });
        });
    }

    function fetchGiftStatus() {
        fetch(SHEETDB_URL)
            .then(response => response.json())
            .then(data => {
                console.log("Gift Data:", data);
                data.forEach(item => {
                    if (item.status !== 'disponivel') {
                        markGiftAsTaken(item.id);
                    }
                });
            })
            .catch(error => console.error('Error fetching gifts:', error));
    }

    // Gift Selection Logic - Opens Modal
    function selectGift(giftName, giftId) {
        const modal = document.getElementById('gift-modal');
        const modalTitle = document.getElementById('modal-gift-name');
        const giftInput = document.getElementById('gift-item');

        if (modal && modalTitle && giftInput) {
            modalTitle.innerText = `Presentear com: ${giftName}`;
            giftInput.value = giftName;
            // Store the ID for the API call
            giftInput.dataset.id = giftId;

            modal.classList.add('active');
        }
    }

    // Handle Dropdown Selection
    function handleGiftSelection() {
        const selector = document.getElementById('gift-selector');
        const selectedOption = selector.options[selector.selectedIndex];

        if (!selector.value) {
            showToast("Por favor, selecione um presente na lista.");
            return;
        }

        if (selectedOption.disabled) {
            showToast("Este presente já foi escolhido por outra pessoa.");
            return;
        }

        selectGift(selectedOption.text, selector.value);
    }

    function markGiftAsTaken(id) {
        // Handle Dropdown Options
        const selector = document.getElementById('gift-selector');
        if (selector) {
            const option = selector.querySelector(`option[value="${id}"]`);
            if (option) {
                option.disabled = true;
                option.innerText = `${option.innerText} (Já escolhido)`;
            }
        }

        // Handle Cards (like Honeymoon)
        const giftCard = document.querySelector(`.gift-card[data-id="${id}"]`);
        if (giftCard && id === 'lua_mel') { // Only strict check for honeymon or legacy cards
            giftCard.classList.add('taken');
            const btn = giftCard.querySelector('button');
            if (btn) btn.innerText = "Já Escolhido";
        }
    }

    // Convert to global for HTML access
    window.selectGift = selectGift;
    window.handleGiftSelection = handleGiftSelection;
    window.markGiftAsTaken = markGiftAsTaken; // Used by fetch loop
});

// Toast Notification Helper
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

// Pix Modal Logic
function openPixModal() {
    const pixModal = document.getElementById('pix-modal');
    if (pixModal) {
        pixModal.classList.add('active');
    }
}

function copyPixCode() {
    const pixCode = document.getElementById('pix-code-text').innerText;

    // Fallback function for older browsers or non-secure contexts
    const copyWithFallback = (text) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed'; // Avoid scrolling to bottom
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showToast("Código Pix copiado com sucesso!");
            } else {
                showToast("Erro ao copiar código Pix. Tente manualmente.");
            }
        } catch (err) {
            console.error('Erro no fallback:', err);
            showToast("Erro ao copiar. Tente selecionar e copiar manualmente.");
        }

        document.body.removeChild(textarea);
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(pixCode).then(() => {
            showToast("Código Pix copiado com sucesso!");
        }).catch(err => {
            console.error('Erro ao copiar (API):', err);
            // Try fallback if API fails
            copyWithFallback(pixCode);
        });
    } else {
        // Use fallback immediately if Clipboard API is not available
        copyWithFallback(pixCode);
    }
}

// Add event listeners for Pix Modal closing
document.addEventListener('DOMContentLoaded', () => {
    const pixModal = document.getElementById('pix-modal');
    const closePixBtn = document.querySelector('.dialog-close-pix');

    if (closePixBtn) {
        closePixBtn.addEventListener('click', () => {
            pixModal.classList.remove('active');
        });
    }

    if (pixModal) {
        pixModal.addEventListener('click', (e) => {
            if (e.target === pixModal) {
                pixModal.classList.remove('active');
            }
        });
    }
});
