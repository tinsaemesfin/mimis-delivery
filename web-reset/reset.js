document.addEventListener('DOMContentLoaded', function() {
    // Supabase credentials
    const SUPABASE_URL = 'https://kpsfqfntcfxejipieres.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwc2ZxZm50Y2Z4ZWppcGllcmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzMjQ4NDksImV4cCI6MjA1NjkwMDg0OX0.IfUhzmECCR7n26StBzoSqswfNLJBlqhIGVaUF2UiXrs';
    
    // Create Supabase client
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // DOM elements
    const resetForm = document.getElementById('reset-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const loadingElement = document.getElementById('loading');
    const debugInfo = document.getElementById('debug-info');
    const debugContent = document.getElementById('debug-content');
    
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    let token = params.get('token') || params.get('access_token');
    let code = params.get('code');
    
    // Check URL hash for token (important for Supabase auth redirects)
    if (!token && !code && window.location.hash) {
        // First try with URLSearchParams
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        token = hashParams.get('access_token') || hashParams.get('token');
        code = hashParams.get('code');
        
        // If still no token or code, try regex for other formats
        if (!token && !code) {
            const tokenMatch = window.location.hash.match(/access_token=([^&]+)|token=([^&]+)/);
            const codeMatch = window.location.hash.match(/code=([^&]+)/);
            
            if (tokenMatch) {
                token = tokenMatch[1] || tokenMatch[2];
            }
            
            if (codeMatch) {
                code = codeMatch[1];
            }
        }
    }
    
    // Log what we found (safely)
    if (token) {
        console.log('Token extracted from URL:', `${token.substring(0, 5)}...${token.substring(token.length - 5)}`);
    }
    
    if (code) {
        console.log('Code extracted from URL:', `${code.substring(0, 5)}...${code.substring(code.length - 5)}`);
    }
    
    if (!token && !code) {
        console.log('No token or code found in URL');
    }
    
    // Show debug info in development
    const showDebug = params.get('debug') === 'true';
    if (showDebug) {
        debugInfo.classList.remove('hidden');
        debugContent.textContent = JSON.stringify({
            url: window.location.href,
            params: Object.fromEntries(params.entries()),
            hash: window.location.hash,
            token: token ? `${token.substring(0, 5)}...${token.substring(token.length - 5)}` : 'Not found',
            code: code ? `${code.substring(0, 5)}...${code.substring(code.length - 5)}` : 'Not found',
            error: window.location.hash.includes('error') ? window.location.hash : 'No error in hash'
        }, null, 2);
    }
    
    // Check for errors in hash
    if (window.location.hash && window.location.hash.includes('error')) {
        const errorMatch = window.location.hash.match(/error_description=([^&]+)/);
        const errorCodeMatch = window.location.hash.match(/error_code=([^&]+)/);
        
        const errorCode = errorCodeMatch ? errorCodeMatch[1] : '';
        console.log('Error code from hash:', errorCode);
        
        if (errorCode === 'otp_expired') {
            displayError('This password reset link has expired. Please request a new password reset link.');
            resetForm.style.display = 'none';
            return;
        }
        
        if (errorMatch && errorMatch[1]) {
            const errorDesc = decodeURIComponent(errorMatch[1].replace(/\+/g, ' '));
            displayError(`Error: ${errorDesc}`);
        } else {
            displayError('An error occurred with the reset link. Please request a new one.');
        }
    }
    
    // Check if token or code is available
    if (!token && !code) {
        displayError('No reset token or code found in the URL. Please request a new password reset link.');
        resetForm.style.display = 'none';
        return;
    }
    
    // If we have a code, try to exchange it for a session immediately
    if (code) {
        console.log('Found code, attempting to exchange for session...');
        exchangeCodeForSession(code);
    }
    
    // Handle form submission
    resetForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Validate password
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (password.length < 6) {
            displayError('Password must be at least 6 characters long.');
            return;
        }
        
        if (password !== confirmPassword) {
            displayError('Passwords do not match.');
            return;
        }
        
        try {
            // Show loading state
            showLoading(true);
            hideError();
            
            // First, try with code if available (recommended approach)
            if (code) {
                const result = await resetPasswordWithCode(code, password);
                if (result.success) {
                    resetForm.style.display = 'none';
                    successMessage.classList.remove('hidden');
                    return;
                }
                // If code method fails, we'll fall through to try token methods
                console.warn('Code method failed, trying token methods:', result.error);
            }
            
            // If we have a token (or code method failed), try token-based methods
            if (token) {
                console.log('Attempting password reset with token');
                
                // Try the verify endpoint first (works best for TokenHash from email)
                const verifyResponse = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'X-Client-Info': 'reset-password-page'
                    },
                    body: JSON.stringify({
                        token: token,
                        type: 'recovery',
                        password: password
                    })
                });
                
                const verifyData = await verifyResponse.json();
                
                if (verifyResponse.ok) {
                    console.log('Password reset successful via verify endpoint');
                    // Success
                    resetForm.style.display = 'none';
                    successMessage.classList.remove('hidden');
                    return;
                }
                
                console.error('Verify endpoint failed:', verifyData);
                
                // Try other token-based methods as fallbacks
                const result = await tryFallbackMethods(token, password);
                if (result.success) {
                    resetForm.style.display = 'none';
                    successMessage.classList.remove('hidden');
                    return;
                }
                
                throw new Error(result.error || 'All password reset methods failed. Please request a new reset link.');
            }
            
            // If we reach here, both code and token methods have failed
            throw new Error('Unable to reset password with the provided link. Please request a new reset link.');
            
        } catch (error) {
            console.error('Password reset error:', error);
            displayError(error.message || 'Failed to reset your password. Please try again or request a new reset link.');
        } finally {
            showLoading(false);
        }
    });
    
    // Attempt to exchange code for session (on page load)
    async function exchangeCodeForSession(code) {
        try {
            console.log('Exchanging code for session...');
            // Use the Supabase JS client to exchange the code
            const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);
            
            if (error) {
                console.error('Error exchanging code for session:', error);
                return { success: false, error: error.message };
            }
            
            console.log('Successfully exchanged code for session');
            return { success: true, session: data.session };
        } catch (error) {
            console.error('Exception during code exchange:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Reset password using code method (most reliable)
    async function resetPasswordWithCode(code, newPassword) {
        try {
            console.log('Attempting password reset using code...');
            
            // First exchange the code for a session
            const exchangeResult = await exchangeCodeForSession(code);
            if (!exchangeResult.success) {
                return { success: false, error: exchangeResult.error || 'Failed to exchange code for session' };
            }
            
            // Now update the password using the session
            const { error } = await supabaseClient.auth.updateUser({
                password: newPassword
            });
            
            if (error) {
                console.error('Error updating password with session:', error);
                return { success: false, error: error.message };
            }
            
            console.log('Password updated successfully with code method!');
            return { success: true };
        } catch (error) {
            console.error('Error in resetPasswordWithCode:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Try fallback methods if the primary method fails
    async function tryFallbackMethods(token, password) {
        try {
            // Try the recovery endpoint directly
            console.log('Trying recovery endpoint as fallback...');
            
            const recoverResponse = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                    token: token,
                    password: password
                })
            });
            
            if (recoverResponse.ok) {
                console.log('Password reset successful via recover endpoint');
                return { success: true };
            }
            
            const recoverData = await recoverResponse.json();
            console.error('Recovery endpoint failed:', recoverData);
            
            // Last attempt: Try to exchange the token for a session first
            console.log('Trying token exchange as final attempt...');
            
            // Try to get a session directly from token
            const tokenResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password_recovery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                    token: token
                })
            });
            
            if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                console.log('Successfully obtained session from token');
                
                // Now update password with the session
                const updateResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${tokenData.access_token}`
                    },
                    body: JSON.stringify({
                        password: password
                    })
                });
                
                if (updateResponse.ok) {
                    console.log('Password update successful!');
                    return { success: true };
                } else {
                    const updateError = await updateResponse.json();
                    console.error('User update failed:', updateError);
                    return { success: false, error: updateError.message };
                }
            } else {
                const tokenError = await tokenResponse.json();
                console.error('Token exchange failed:', tokenError);
                return { success: false, error: tokenError.message };
            }
        } catch (error) {
            console.error('Error in tryFallbackMethods:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Helper functions
    function displayError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Show error action buttons for critical errors
        if (message.includes('expired') || message.includes('Invalid') || message.includes('failed')) {
            document.getElementById('error-action').classList.remove('hidden');
        }
    }
    
    function hideError() {
        errorMessage.style.display = 'none';
        document.getElementById('error-action').classList.add('hidden');
    }
    
    function showLoading(isLoading) {
        loadingElement.style.display = isLoading ? 'flex' : 'none';
        if (isLoading) {
            resetForm.querySelector('button').disabled = true;
            resetForm.querySelector('button').textContent = 'Processing...';
        } else {
            resetForm.style.display = 'block';
            resetForm.querySelector('button').disabled = false;
            resetForm.querySelector('button').textContent = 'Reset Password';
        }
    }
}); 