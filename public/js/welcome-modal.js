// Smart Contact Parser Welcome Modal
(function() {
    'use strict';

    // Check if modal should be shown
    function shouldShowModal() {
        const hideModalPermanent = localStorage.getItem('hideSCPWelcomeModal');
        const hideModalThisSession = sessionStorage.getItem('hideSCPWelcomeModal');
        
        if (hideModalPermanent === 'true' || hideModalThisSession === 'true') {
            return false;
        }
        
        return true;
    }

    // Create and show modal
    function createModal() {
        if (!shouldShowModal()) return;

        const signedUpEmail = localStorage.getItem('scpSignedUpEmail');
        const hasSignedUp = !!signedUpEmail;

        const modalHTML = `
            <div id="scp-welcome-modal" class="scp-modal-overlay">
                <div class="scp-modal-container">
                    <button class="scp-modal-close" onclick="closeSCPModal()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    
                    <div class="scp-modal-content">
                        <!-- Header -->
                        <div class="scp-modal-header">
                            <div class="scp-modal-icon">🔍</div>
                            <h2>Welcome to <span class="scp-gradient-text">Smart Contact Parser</span></h2>
                            <p class="scp-modal-subtitle">AI-powered contact extraction, private by design.</p>
                        </div>

                        <!-- Mission Boxes -->
                        <div class="scp-modal-section">
                            <div class="scp-info-box scp-box-violet">
                                <div class="scp-box-header">
                                    <span class="scp-box-icon">🔑</span>
                                    <h3>Bring Your Own Key (BYOK)</h3>
                                </div>
                                <p>Smart Contact Parser uses <strong>your OpenAI API key</strong>, stored only in your browser's 
                                   localStorage. Your key never touches our servers — AI calls go directly from your browser to OpenAI. 
                                   You control your costs and your credentials.</p>
                            </div>

                            <div class="scp-info-box scp-box-indigo">
                                <div class="scp-box-header">
                                    <span class="scp-box-icon">🛡️</span>
                                    <h3>Zero Server Storage</h3>
                                </div>
                                <p>All contact data is processed <strong>entirely client-side</strong>. No database on our end, no 
                                   server-side processing, no data retention. Your contacts go from your browser to OpenAI and back — 
                                   we're never in the middle.</p>
                            </div>

                            <div class="scp-info-box scp-box-fuchsia">
                                <div class="scp-box-header">
                                    <span class="scp-box-icon">📚</span>
                                    <h3>Upcoming Book</h3>
                                </div>
                                <p><strong>"The Alchemist's Cookbook"</strong> — A book on personal philosophy and 
                                   AI's potential to transform humanity. <span class="scp-gradient-text">Free for 
                                   newsletter subscribers</span> when it launches!</p>
                            </div>
                        </div>

                        <!-- Newsletter Signup -->
                        <div class="scp-newsletter-section">
                            <div class="scp-newsletter-header">
                                <span class="scp-newsletter-icon">✉️</span>
                                <div>
                                    <h3>Get Updates & Free Book</h3>
                                    <p>Stay informed about new features, AI model updates, and receive the book when it's ready!</p>
                                </div>
                            </div>
                            
                            ${hasSignedUp ? `
                                <div class="scp-signup-success">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                    </svg>
                                    <span>Thank you! You'll receive updates soon.</span>
                                </div>
                            ` : `
                                <form id="scp-newsletter-form" class="scp-newsletter-form">
                                    <div class="scp-input-wrapper">
                                        <input 
                                            type="email" 
                                            id="scp-modal-email" 
                                            placeholder="your@email.com"
                                            required
                                        />
                                        <button type="submit" class="scp-btn-submit" id="scp-submit-btn">
                                            Sign Up
                                        </button>
                                    </div>
                                    <div id="scp-newsletter-status" class="scp-newsletter-status"></div>
                                </form>
                            `}
                        </div>

                        <!-- Don't Show Again -->
                        <div class="scp-modal-checkbox">
                            <input type="checkbox" id="scp-dont-show" />
                            <label for="scp-dont-show">Don't show this message again</label>
                        </div>

                        <!-- Action Buttons -->
                        <div class="scp-modal-actions">
                            <button class="scp-btn scp-btn-secondary" onclick="closeSCPModal()">
                                Start Parsing
                            </button>
                            <a href="donate.html" class="scp-btn scp-btn-primary" onclick="closeSCPModal()">
                                ❤️ Support Development
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        if (!hasSignedUp) {
            setupNewsletterForm();
        }
        
        // Show modal with animation
        setTimeout(() => {
            const modal = document.getElementById('scp-welcome-modal');
            if (modal) modal.classList.add('scp-modal-show');
        }, 100);
    }

    // Setup newsletter form
    function setupNewsletterForm() {
        const form = document.getElementById('scp-newsletter-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('scp-modal-email');
            const submitBtn = document.getElementById('scp-submit-btn');
            const statusEl = document.getElementById('scp-newsletter-status');
            const email = emailInput.value.trim();
            
            if (!email) return;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing Up...';
            statusEl.textContent = '';
            statusEl.className = 'scp-newsletter-status';

            try {
                const response = await fetch('https://ai-alchemist.netlify.app/api/newsletter/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email, 
                        source: 'smartcontactparser_welcome_modal' 
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('scpSignedUpEmail', email);
                    statusEl.className = 'scp-newsletter-status scp-status-success';
                    statusEl.textContent = '✓ Thank you! You\'ll receive updates soon.';
                    
                    setTimeout(() => {
                        form.innerHTML = `
                            <div class="scp-signup-success">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                <span>Thank you! You'll receive updates soon.</span>
                            </div>
                        `;
                    }, 1500);
                } else {
                    statusEl.className = 'scp-newsletter-status scp-status-error';
                    statusEl.textContent = '✗ ' + (data.error || 'Failed to subscribe. Please try again.');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign Up';
                }
            } catch (error) {
                console.error('Newsletter subscription error:', error);
                statusEl.className = 'scp-newsletter-status scp-status-error';
                statusEl.textContent = '✗ Network error. Please check your connection.';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign Up';
            }
        });
    }

    // Close modal function (global)
    window.closeSCPModal = function() {
        const modal = document.getElementById('scp-welcome-modal');
        const dontShow = document.getElementById('scp-dont-show');
        
        if (dontShow && dontShow.checked) {
            localStorage.setItem('hideSCPWelcomeModal', 'true');
        } else {
            sessionStorage.setItem('hideSCPWelcomeModal', 'true');
        }
        
        if (modal) {
            modal.classList.remove('scp-modal-show');
            setTimeout(() => modal.remove(), 300);
        }
    };

    // Initialize modal on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(createModal, 1000);
        });
    } else {
        setTimeout(createModal, 1000);
    }
})();
