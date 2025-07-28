/* Backend Guy*/
const API_URL = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURATION ---
  const API_URL = "http://127.0.0.1:5000"; // Your backend server address

  // --- ELEMENT SELECTORS ---
  const signInForm = document.getElementById("signInForm");
  const signUpForm = document.getElementById("signUpForm");
  const userNameDisplay = document.getElementById("userNameDisplay");
  const logoutLink = document.getElementById("logoutLink");
  const accountBalanceElement = document.getElementById("accountBalance");
  const addFundButton = document.getElementById("addFundButton");
  const fundAmountInput = document.getElementById("fundAmount");
  const accountLink = document.getElementById("accountLink");
  const accountUsernameInput = document.getElementById("accountUsername");
  const accountEmailInput = document.getElementById("accountEmail");

  // --- NEW SESSION MANAGEMENT ---
  const setSession = (sessionData) => {
    localStorage.setItem("supabase.session", JSON.stringify(sessionData));
  };
  const getSession = () => {
    const session = localStorage.getItem("supabase.session");
    return session ? JSON.parse(session) : null;
  };
  const clearSession = () => {
    localStorage.removeItem("supabase.session");
  };

  // --- Sign Up Form Submission ---
  if (signUpForm) {
    signUpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("signUpUsername").value;
      const email = document.getElementById("signUpEmail").value;
      const password = document.getElementById("signUpPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      // Your existing validation logic is great, keep it.
      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }
      if (!username || !email || !password) {
        alert("Please fill in all fields.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error);
        }
        alert("Sign Up Successful! Please check your email for verification. Redirecting to Sign In.");
        window.location.href = "signin.html";
      } catch (error) {
        alert(`Sign up failed: ${error.message}`);
        console.error("Signup Error:", error);
      }
    });
  }

  // --- Sign In Form Submission ---
  if (signInForm) {
    signInForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("signInEmail").value;
      const password = document.getElementById("signInPassword").value;

      if (!email || !password) {
        alert("Please enter email and password.");
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error);
        }
        setSession(data.session);
        alert("Sign In Successful! Redirecting to Dashboard.");
        window.location.href = "dashboard.html";
      } catch (error) {
        alert(`Login failed: ${error.message}`);
        console.error("Login Error:", error);
      }
    });
  }

  // --- Dashboard Logic ---
  if (window.location.pathname.includes("dashboard.html")) {
    const currentSession = getSession();
    if (!currentSession) {
      window.location.href = "signin.html";
      return;
    }
    const currentUser = currentSession.user;

    if (userNameDisplay) {
      userNameDisplay.innerHTML = `<i class="fas fa-user-circle"></i> ${currentUser.email}`;
    }
    if (accountBalanceElement) {
        const balance = localStorage.getItem("userBalance") || "0.00";
        accountBalanceElement.textContent = `NGN ${parseFloat(balance).toLocaleString()}`;
    }
    if (accountEmailInput) {
      accountEmailInput.value = currentUser.email || "";
    }
    if (logoutLink) {
      logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        clearSession();
        localStorage.removeItem("userBalance");
        alert("Logged out successfully.");
        window.location.href = "signin.html";
      });
    }

    if (addFundButton) {
      addFundButton.addEventListener("click", async () => {
        const amount = parseFloat(fundAmountInput.value);
        if (isNaN(amount) || amount <= 0) {
          alert("Please enter a valid amount to add.");
          return;
        }
        try {
          const response = await fetch(`${API_URL}/api/initialize-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email, amount: amount })
          });
          const data = await response.json();
          if (!response.ok || !data.status) {
            throw new Error(data.message || 'Could not start payment.');
          }
          window.location.href = data.data.authorization_url;
        } catch (error) {
          alert(`Error: ${error.message}`);
          console.error("Payment Error:", error);
        }
      });
    }

    // --- YOUR EXISTING UI NAVIGATION CODE (UNCHANGED) ---
    const navItems = document.querySelectorAll(".nav-item");
    const contentSections = document.querySelectorAll(".content-section");
    const activateSection = (sectionId) => {
      navItems.forEach((item) => item.classList.remove("active"));
      contentSections.forEach((section) => section.classList.remove("active"));
      const activeNavItem = document.querySelector(`[data-section="${sectionId}"]`);
      if (activeNavItem) {
        activeNavItem.classList.add("active");
      }
      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
        targetSection.classList.add("active");
      }
    };
    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const sectionId = item.getAttribute("data-section");
        activateSection(sectionId);
      });
    });
    if (accountLink) {
      accountLink.addEventListener("click", (e) => {
        e.preventDefault();
        activateSection("account");
      });
    }
    const initialHash = window.location.hash.substring(1);
    if (initialHash && document.getElementById(initialHash)) {
      activateSection(initialHash);
    } else {
      activateSection("new-order");
    }
    const newOrderForm = document.querySelector(".new-order-form");
    if (newOrderForm) {
      newOrderForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const description = newOrderForm.querySelector("textarea").value;
        const link = document.getElementById("orderLink").value;
        const quantity = document.getElementById("orderQuantity").value;
        if (!description || !link || !quantity) {
          alert("Please fill in all required fields for the new order.");
          return;
        }
        alert(`Order submitted!\nDescription: ${description}\nLink: ${link}\nQuantity: ${quantity}`);
        newOrderForm.reset();
      });
    }
    // --- VERIFY PAYMENT ON PAGE LOAD ---
    const verifyPaymentOnLoad = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference');

      if (reference) {
        document.body.style.opacity = "0.5";
        alert("Verifying your payment, please wait...");

        try {
          const response = await fetch(`${API_URL}/api/verify-payment/${reference}`);
          const data = await response.json();

          if (data.status === 'success') {
            alert("Payment successful! Your balance will be updated.");
            // Update "fake" balance for now
            const amountPaid = data.amount / 100;
            const currentBalance = parseFloat(localStorage.getItem("userBalance") || "0.00");
            const newBalance = currentBalance + amountPaid;
            localStorage.setItem("userBalance", newBalance);
            if(accountBalanceElement) {
                accountBalanceElement.textContent = `NGN ${newBalance.toLocaleString()}`;
            }
          } else {
            alert(`Payment failed or was cancelled: ${data.message}`);
          }
        } catch (error) {
          alert("An error occurred while verifying your payment.");
          console.error("Verification error:", error);
        } finally {
          window.history.replaceState({}, document.title, window.location.pathname);
          document.body.style.opacity = "1";
        }
      }
    };

    // Run the check as soon as the dashboard loads
    verifyPaymentOnLoad();

  } 
});

document.getElementById("hamburger").addEventListener("click", function () {
  const navLinks = document.querySelector(".nav-links");
  navLinks.classList.toggle("active");
});

//NEW ORDER
const servicesData = {
  "🎁 Free Services { ❤️ Likes, 👀views }": [
    {
      id: "1",
      name: "👀 Free Instagram post views",
      min: 100,
      max: 100,
      rate: 3.0,
      description:
        "Testing, testing, 1-2-3! 🎉 this social media service is so free, it's practically doing cartwheels. Join now and let's make your feed the life of the party! 🥳",
    },
    {
      id: "2",
      name: "❤️ Free Instagram post likes",
      min: 10,
      max: 100,
      rate: 5.0,
      description:
        "Get free Instagram likes for your posts. Limited quantity available daily.",
    },
    {
      id: "3",
      name: "👀 Free Facebook Reel Views",
      min: 100,
      max: 100,
      rate: 40.0,
      description:
        "Boost your Facebook reels with free views. Perfect for increasing engagement.",
    },
  ],

  "💝 100% Free Services { Max : 200K }": [
    {
      id: "4",
      name: "👀 Free TikTok Views Exclusively for Creators",
      min: 100,
      max: 200000,
      rate: 0.0,
      description:
        "Exclusive free TikTok views for content creators. High-quality engagement guaranteed.",
    },
    {
      id: "5",
      name: "❤️ TikTok Likes Z",
      min: 10,
      max: 5000000,
      rate: 210.0,
      description: "~ Instant start<br />~ 15K/Day<br />~ R30",
    },
    {
      id: "6",
      name: "⤵️ TikTok Shares",
      min: 10,
      max: 999999999,
      rate: 69.0,
      description: "~ Instant start<br />~ 10M/Day<br />~ NR",
    },
    {
      id: "7",
      name: "🗳️ TikTok Saves",
      min: 100,
      max: 15000,
      rate: 346.0,
      description: "~ Instant start<br />~ NR",
    },
  ],

  "👥 Instagram Followers Mixed": [
    {
      id: "8",
      name: "👥 Instagram Followers - Mixed Quality",
      min: 50,
      max: 10000,
      rate: 15.0,
      description:
        "❗ If the following settings are not configured, your order will not be completed.<br />⚠️ After the last update, some features need to be checked manually. Please make sure to follow the steps below in order!<br />1. Go to Account Settings.<br />2. Select Follow and Invite Friends.<br />3. Find the Mark for Review option and uncheck it.<br />⚠️ If the settings are not adjusted, your followers may appear to be missing. For example, if 1,000 followers are to be added, potential spam accounts might fall into the Flagged section under the followers. So, out of 1,000 : 500 followers will go directly, and 200 followers will go as requests which you must manually approve. If followers in this section are deleted, there will be NO compensation or refund.<br />🔸 Min: 10<br />🔸 Max: 5,000<br /> 🔸 Link: Username<br /> 🔸 Start Speed: 0-15 Minutes<br /> 🔸 Drop Rate: A drop of around 10-20% has been observed.<br /> 🔸 Refill: No refill guarantee for potential drops.<br />  No refunds or refill.<br /> Notes:<br /> 📌 The processing speed may vary during times of high service demand.<br /> 📌 Do not place a second order for the same link until your first order is completed in the system.",
    },

    {
      id: "9",
      name: "👥 Instagram Followers | Europe ",
      min: 10,
      max: 5000000,
      rate: 2618.0,
      description:
        "❗ If the following settings are not configured, your order will not be completed.<br />⚠️ After the last update, some features need to be checked manually. Please make sure to follow the steps below in order!<br />1. Go to Account Settings.<br />2. Select Follow and Invite Friends.<br />3. Find the Mark for Review option and uncheck it.<br />⚠️ If the settings are not made, it will seem like your Followers are incomplete. For example, if 1000 followers are entered, possible spam accounts are shown in the Marked menu in the Followers section of the person's profile. In other words, for example, 800 followers go directly to 1000 accounts, and 200 followers go as requests. You must manually approve these requests. If the followers that fall here are deleted, compensation or refund will NEVER be made.<br />🔸 Min: 10<br />🔸 Max: 5,000,000<br /> 🔸 Link: Username<br /> 🔸 Quality: Global Users<br /> 🔸 Drop Rate: Low drop rate.<br /> 🔸 Refill: No refill guarantee for potential drops.<br /> 🔸 Orders placed with incorrect links, private profiles, or restricted profiles will be marked as completed. No refunds or refill.<br /> Notes:<br /> 📌 Processing start times may vary during peak periods.<br /> 📌 Do not place a second order with the same link before your current order is completed in the system.",
    },
    {
      id: "10",
      name: "👥  Instagram Followers | Instant Speed  ",
      min: 10,
      max: 1000000,
      rate: 3449.0,
      description:
        "❗ If the following settings are not configured, your order will not be completed.<br />⚠️ After the last update, some features need to be checked manually. Please make sure to follow the steps below in order!<br />1. Go to Account Settings.<br />2. Select Follow and Invite Friends.<br />3. Find the Mark for Review option and uncheck it.<br />⚠️ If the settings are not adjusted, your followers may appear to be missing. For example, if 1,000 followers are to be added, potential spam accounts might fall into the Flagged section under the followers. So, out of 1,000 : 500 followers will go directly, and 200 followers will go as requests which you must manually approve. If followers in this section are deleted, there will be NO compensation or refund.<br />🔸 Min: 10<br />🔸 Max: 5,000<br /> 🔸 Link: Username<br /> 🔸 Start Speed: 0-15 Minutes<br /> 🔸 Drop Rate: A drop of around 10-20% has been observed.<br /> 🔸 Refill: No refill guarantee for potential drops.<br />  No refunds or refill.<br /> Notes:<br /> 📌 The processing speed may vary during times of high service demand.<br /> 📌 Do not place a second order for the same link until your first order is completed in the system.",
    },
    {
      id: "11",
      name: "👥  Instagram Followers | Instant  ",
      min: 10,
      max: 5000000,
      rate: 2696.0,
      description:
        "❗ If the following settings are not configured, your order will not be completed.<br />⚠️ After the last update, some features need manual adjustments. Please make sure to follow the steps below in order!<br />1. Go to Account Settings.<br />2. Select Follow and Invite Friends.<br />3. Find the Mark for Review option and uncheck it.<br />⚠️ If the settings are not adjusted, your followers may appear to be missing. For example, if 1,000 followers are to be added, potential spam accounts might fall into the Flagged section under the followers. So, out of 1,000 : 500 followers will go directly, and 200 followers will go as requests which you must manually approve. If followers in this section are deleted, there will be NO compensation or refund.<br />🔸 Min: 10<br />🔸 Max: 5,000<br /> 🔸 Link: Username<br /> 🔸 Start Speed: 0-15 Minutes<br /> 🔸 Drop Rate: A drop of around 30% has been observed.<br /> 🔸 Refill: No refill guarantee for potential drops.<br />  No refunds or refill.<br /> Notes:<br /> 📌 The processing speed may vary during times of high service demand.<br /> 📌 Do not place a second order for the same link until your first order is completed in the system.",
    },
    {
      id: "12",
      name: "👥  Instagram Followers | Instant  ",
      min: 10,
      max: 400000,
      rate: 3088.0,
      description:
        "❗ If the following settings are not configured, your order will not be completed.<br />⚠️ After the last update, some features need manual adjustments. Please make sure to follow the steps below in order!<br />1. Go to Account Settings.<br />2. Select Follow and Invite Friends.<br />3. Find the Mark for Review option and uncheck it.<br />⚠️ If the settings are not adjusted, your followers may appear to be missing. For example, if 1,000 followers are to be added, potential spam accounts might fall into the Flagged section under the followers. So, out of 1,000 : 500 followers will go directly, and 200 followers will go as requests which you must manually approve. If followers in this section are deleted, there will be NO compensation or refund.<br />🔸 Min: 10<br />🔸 Max: 5,000<br /> 🔸 Link: Username<br /> 🔸 Start Speed: 0-15 Minutes<br /> 🔸 Drop Rate: A drop of around 10-20% has been observed.<br /> 🔸 Refill: No refill guarantee for potential drops.<br />  No refunds or refill.<br /> Notes:<br /> 📌 The processing speed may vary during times of high service demand.<br /> 📌 Do not place a second order for the same link until your first order is completed in the system.",
    },
    {
      id: "13",
      name: "👥  Instagram Followers | Instant Speed  ",
      min: 10,
      max: 5000000,
      rate: 3918.0,
      description:
        "❗ If the following settings are not configured, your order will not be completed.<br />⚠️ After the last update, some features need to be checked manually. Please make sure to follow the steps below in order!<br />1. Go to Account Settings.<br />2. Select Follow and Invite Friends.<br />3. Find the Mark for Review option and uncheck it.<br />⚠️ If the settings are not adjusted, your followers may appear to be missing. For example, if 1,000 followers are to be added, potential spam accounts might fall into the Flagged section under the followers. So, out of 1,000 : 500 followers will go directly, and 200 followers will go as requests which you must manually approve. If followers in this section are deleted, there will be NO compensation or refund.<br />🔸 Min: 10<br />🔸 Max: 5,000<br /> 🔸 Link: Username<br /> 🔸 Start Speed: 0-15 Minutes<br /> 🔸 Drop Rate: A drop of around 10-20% has been observed.<br /> 🔸 Refill: No refill guarantee for potential drops.<br />  No refunds or refill.<br /> Notes:<br /> 📌 The processing speed may vary during times of high service demand.<br /> 📌 Do not place a second order for the same link until your first order is completed in the system.",
    },
    {
      id: "14",
      name: "👥  Instagram Followers | General  ",
      min: 10,
      max: 5000000,
      rate: 2863.0,
      description:
        "⚠️ This item is mandatory to receive followers, otherwise it will not be completed.<br />⚠️ The Flag Feature Should Be Off<br /> 1. Go to your Account Settings.<br /> 2. Select Follow and Invite Friends.<br /> 3. Locate the Flag for Review option and uncheck it.",
    },
    {
      id: "15",
      name: "👥  Instagram Followers | Low Drop Rate  ",
      min: 10,
      max: 5000000,
      rate: 2618.0,
      description:
        "⚠️ After the latest update, some features need manual adjustments. Please ensure you follow the steps below in order:<br />1. Go to Account Settings.<br />2. Select Follow and Invite Friends.<br />3. Find the Mark for Review option and uncheck it.",
    },

    {
      id: "16",
      name: "👥  Instagram Followers | Instantly  ",
      min: 10,
      max: 1000000,
      rate: 3107.0,
      description:
        "⚠️ The service will send even if the Flag for review option is either active or inactive.<br />🔸Profile Photo Ratio: There are 95% profile photos.<br />🔸Refill : 60 days Refill guaranteed. <br />🔸 All orders placed with wrong link, private profile, restricted profile will be marked as completed. There is no refund or compensation.<br />🔸 Min: 10<br />🔸 Max: 1,000,000<br />🔸 Link: Username <br />🔸 No Refill is provided for orders below the starting number<br />Notes: <br />📌 When the service is busy, the processing speed varies. <br />📌 Do not place a second order from the same link until your order is completed in the system.",
    },
    {
      id: "17",
      name: "👥  Instagram Followers | Instantly  ",
      min: 10,
      max: 5000000,
      rate: 3152.0,
      description:
        "⚠️ The service will send even if the Flag for review option is either active or inactive.<br />🔸Profile Photo Ratio: All users have profile photos.<br />🔸Refill : 60 days. <br />🔸 All orders placed with wrong link, private profile, limited profile will be marked as completed. There is no refund or compensation.<br />🔸 If the settings are not made, the order will be automatically canceled<br/>🔸 Min: 10<br />🔸 Max: 5,000,000<br />🔸 Link: Username <br />🔸 No Refill is provided for orders below the starting number<br />Notes: <br />📌 The speed at which the service starts varies during busy times. <br />📌 Do not place a second order from the same link until your order is completed in the system.",
    },
    {
      id: "18",
      name: "👥  Instagram Followers | Instantly  ",
      min: 10,
      max: 1000000,
      rate: 5138.0,
      description:
        "⚠️ The service will send even if the Flag for review option is either active or inactive.<br />🔸Profile Photo Ratio: There are 95% profile photos.<br />🔸Refill : 365 days Refill guaranteed. <br />🔸 All orders placed with wrong link, private profile, limited profile will be marked as completed. There is no refund or compensation.<br />🔸 If the settings are not made, the order will be automatically canceled<br/>🔸 Min: 10<br />🔸 Max: 1,000,000<br />🔸 Link: Username <br />🔸 No Refill is provided for orders below the starting number<br />Notes: <br />📌 When the service is busy, the processing speed varies. <br />📌 Do not place a second order from the same link until your order is completed in the system.",
    },
    {
      id: "19",
      name: "👥  Instagram Followers | Instantly  ",
      min: 10,
      max: 1000000,
      rate: 5627.0,
      description:
        "⚠️ The service will send even if the Flag for review option is either active or inactive.<br />🔸Profile Photo Ratio: There are 95% profile photos.<br />🔸Refill : 30 days Refill guaranteed. <br />🔸 All orders placed with wrong link, private profile, limited profile will be marked as completed. There is no refund or refill.<br />🔸 Min: 10<br />🔸 Max: 1,000,000<br />🔸 Link: Username <br />🔸 No Refill is provided for orders below the starting number<br />Notes: <br />📌 When the service is busy, the processing speed varies. <br />📌 Do not place a second order from the same link until your order is completed in the system.",
    },
  ],

  "👥 Instagram Followers | Flag On or Off": [
    {
      id: "20",
      name: "👥 Instagram Followers | Moderate Slow ",
      min: 10,
      max: 100000,
      rate: 2569.0,
      description:
        "❗ If the following settings are not configured, your order will not be completed.<br />⚠️ After the latest update, some features need manual adjustments. Please ensure you follow the steps below in order:<br /> 1. Go to Account Settings.<br />2. Select Follow and Invite Friends.<br />3. Find the Mark for Review option and uncheck it.<br />⚠️ If these settings are not adjusted, your followers may appear to be missing. For example, if 1,000 followers are to be added, potential spam accounts might fall into the Flagged section under the followers. So, out of 1,000 : 800 followers will go directly, and 200 followers will go as requests which you must manually approve. If followers in this section are deleted, there will be NO compensation or refund.<br />🔸 Min: 10<br />🔸 Max: 1,000,000<br />🔸 Link: Username<br />🔸 Start Speed: 0-15 Minutes<br />🔸 Drop Rate: A drop of around 30% has been observed in last week.<br />🔸 Refill: No Refill Guarantee for potential drops.<br />Notes:<br />📌 The processing speed may vary during times of high service demand.<br />📌 Do not place a second order for the same link until your first order is completed in the system.",
    },
    {
      id: "21",
      name: "👥 Instagram Followers | Moderate Slow ",
      min: 10,
      max: 100000,
      rate: 2713.0,
      description:
        "❗ If the following settings are not configured, your order will not be completed.<br />⚠️ After the latest update, some features need manual adjustments. Please ensure you follow the steps below in order:<br /> 1. Go to Account Settings.<br />2. Select Follow and Invite Friends.<br />3. Find the Mark for Review option and uncheck it.<br />⚠️ If these settings are not adjusted, your followers may appear to be missing. For example, if 1,000 followers are to be added, potential spam accounts might fall into the Flagged section under the followers. So, out of 1,000 : 800 followers will go directly, and 200 followers will go as requests which you must manually approve. If followers in this section are deleted, there will be NO compensation or refund.<br />🔸 Min: 10<br />🔸 Max: 1,000,000<br />🔸 Link: Username<br />🔸 Start Speed: 0-15 Minutes<br />🔸 Drop Rate: A drop of around 30% has been observed in last week.<br />🔸 Refill: No Refill Guarantee for potential drops.<br />Notes:<br />📌 The processing speed may vary during times of high service demand.<br />📌 Do not place a second order for the same link until your first order is completed in the system.",
    },
    {
      id: "22",
      name: "👥 Instagram Followers | Moderate Slow ",
      min: 10,
      max: 100000,
      rate: 2837.0,
      description:
        "❗ If the following settings are not configured, your order will not be completed.<br />⚠️ After the latest update, some features need manual adjustments. Please ensure you follow the steps below in order:<br /> 1. Go to Account Settings.<br />2. Select Follow and Invite Friends.<br />3. Find the Mark for Review option and uncheck it.<br />⚠️ If these settings are not adjusted, your followers may appear to be missing. For example, if 1,000 followers are to be added, potential spam accounts might fall into the Flagged section under the followers. So, out of 1,000 : 800 followers will go directly, and 200 followers will go as requests which you must manually approve. If followers in this section are deleted, there will be NO compensation or refund.<br />🔸 Min: 10<br />🔸 Max: 1,000,000<br />🔸 Link: Username<br />🔸 Start Speed: 0-15 Minutes<br />🔸 Drop Rate: A drop of around 30% has been observed in last week.<br />🔸 Refill: No Refill Guarantee for potential drops.<br />Notes:<br />📌 The processing speed may vary during times of high service demand.<br />📌 Do not place a second order for the same link until your first order is completed in the system.",
    },
  ],

  "👥🇳🇬 Nigeria Instagram { Male and Female } Followers": [
    {
      id: "23",
      name: "  👩 🇳🇬 Instagram Nigerian Followers | 100% Nigerian Female Users | Instant Start",
      min: 10,
      max: 100000,
      rate: 6070.0,
      description:
        "🔸 Min: 10<br />🔸 Max: 100,000<br />🔸 Cancel Button Active.<br />🔸 Quality: 100% Nigerian Female Users 🇳🇬<br />🔸 Guaranteed: 30 Days Refill.<br />🔥 The world's highest quality Instagram Nigerian Female follower service.<br />Notes:<br />📌 This service only scans its own sent data and refills its own dropped data.<br />📌 The drop rate is very low.<br />📌 The processing start time may vary during peak service periods.<br />📌 Please wait for your previous order to be completed in the system before placing a second order for the same link.",
    },
    {
      id: "24",
      name: "  👩 🇳🇬 Instagram Nigerian Followers | 100% Nigerian Male Users | Instant Start",
      min: 10,
      max: 100000,
      rate: 6070.0,
      description:
        "🔸 Min: 10<br />🔸 Max: 100,000<br />🔸 Cancel Button Active.<br />🔸 Quality: 100% Nigerian Male Users 🇳🇬<br />🔸 Guaranteed: 30 Days Refill.<br />🔥 The world's highest quality Instagram Nigerian Male follower service.<br />Notes:<br />📌 This service only scans its own sent data and refills its own dropped data.<br />📌 The drop rate is very low.<br />📌 The processing start time may vary during peak service periods.<br />📌 Please wait for your previous order to be completed in the system before placing a second order for the same link.",
    },
  ],

  "👥 Cheapest Instagram Followers | This service Drops": [
    {
      id: "25",
      name: "👥 Instagram Followers | Cheap, High Drop",
      min: 10,
      max: 5000000,
      rate: 1853.0,
      description:
        "Avoid using this service for serious order | This service is mainly available for testing and for customers looking for cheap instagram followers without minding its drops.",
    },
  ],

  "🇳🇬 ❤️Nigerian Instagram { Male and Female } Likes": [
    {
      id: "26",
      name: " ❤️ 🇳🇬 👩 Instagram Nigerian Likes | 100% Nigerian Female Users | Instant Start",
      min: 10,
      max: 100000,
      rate: 607.0,
      description:
        "🔸 Min: 10<br />🔸 Max: 100,000<br />🔸 Cancel Button Active.<br />🔸 Quality: 100% Nigerian Female Users 🇳🇬<br />🔸 Guaranteed: 30 Days Refill.<br />🔥 The world's highest quality Instagram Nigerian Female likes service.<br />Notes:<br />📌 This service only scans its own sent data and refills its own dropped data.<br />📌 The drop rate is very low.<br />📌 The processing start time may vary during peak service periods.<br />📌 Please wait for your previous order to be completed in the system before placing a second order for the same link.",
    },
    {
      id: "27",
      name: " ❤️ 🇳🇬 👩 Instagram Nigerian Likes | 100% Nigerian Male Users | Instant Start",
      min: 10,
      max: 100000,
      rate: 607.0,
      description:
        "🔸 Min: 10<br />🔸 Max: 100,000<br />🔸 Cancel Button Active.<br />🔸 Quality: 100% Nigerian Mmale Users 🇳🇬<br />🔸 Guaranteed: 30 Days Refill.<br />🔥 The world's highest quality Instagram Nigerian Male likes service.<br />Notes:<br />📌 This service only scans its own sent data and refills its own dropped data.<br />📌 The drop rate is very low.<br />📌 The processing start time may vary during peak service periods.<br />📌 Please wait for your previous order to be completed in the system before placing a second order for the same link.",
    },
  ],

  "❤️ Instagram Likes": [
    {
      id: "28",
      name: "❤️ Instagram Likes - High Quality",
      min: 10,
      max: 200000,
      rate: 116.0,
      description: "Instagram Likes | High Quality",
    },
    {
      id: "29",
      name: "❤️ Instagram Likes | Instant Start",
      min: 10,
      max: 500000,
      rate: 53.0,
      description:
        "🔸 Min: 10<br />🔸 Max: 500.000<br />🔸 Link: Post Link<br />🔸 Quality: Bot likes with and without profile pictures<br />🔸 There may be drops and deletions. You have 30 days to refill. <br />Notes <br />📌 When the service is busy, the speed of starting the process varies. <br />📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
    {
      id: "30",
      name: "❤️ Instagram Likes | No Drop",
      min: 100,
      max: 100000,
      rate: 36.0,
      description: "Instagram Likes | No Drop",
    },
    {
      id: "31",
      name: "❤️ Instagram Likes | Instant Start",
      min: 10,
      max: 500000,
      rate: 77.0,
      description:
        "🔸 Min: 10<br />🔸 Max: 500,000<br />🔸 Link: Post Link<br />🔸 Quality: Bot likes with and without profile pictures<br />🔸 365 days Refill. <br />Notes <br />📌 When the service is busy, the speed of starting the process varies. <br />📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
    {
      id: "32",
      name: "❤️ Instagram Likes | Instant Start",
      min: 10,
      max: 500000,
      rate: 48.0,
      description:
        "🔸 Min: 10<br />🔸 Max: 500,000<br />🔸 Link: Share Link<br />🔸 Quality: Bot likes with and without profile pictures<br />🔸 There may be drops and deletions. Please enter with this in mind. Even all of them can fall, there is no guarantee. Absolutely no refund <br />Notes <br />📌 When the service is busy, the speed of starting the process varies. <br />📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
    {
      id: "33",
      name: "❤️ Instagram Likes | Low Drop",
      min: 10,
      max: 250000,
      rate: 96.0,
      description:
        "🔸 Min: 10<br />🔸 Max: 250,000<br />🔸 Link: Instagram Post Link<br />🔸 Quality: Global Users<br />🔸 The fall is generally low. It is not guaranteed against falls. No compensation is provided in cases of possible decreases <br />Notes <br />📌 When the service is busy, the speed of starting the process varies. <br />📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
    {
      id: "34",
      name: "❤️ Instagram Likes | Instant Start",
      min: 20,
      max: 30000,
      rate: 681.0,
      description:
        "🔸 Min: 20<br />🔸 Max: 30,000<br />🔸 Link: Post Link<br />🔸 Quality: High Quality Likes<br />🔸 No drop <br />Notes <br />📌 When the service is busy, the speed of starting the process varies. <br />📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
    {
      id: "35",
      name: "❤️ Instagram Likes | Instant Start",
      min: 10,
      max: 500000,
      rate: 77.0,
      description: "Instagram Likes | Instant Start",
    },
    {
      id: "36",
      name: "❤️ Instagram Global Likes | Instant Start",
      min: 10,
      max: 500000,
      rate: 48.0,
      description:
        "🔸 Min: 10<br />🔸 Max: 500,000<br />🔸 Link: Share Link<br />🔸 Quality: Bot likes with and without profile pictures<br />🔸 There may be drops and deletions. You have 30 days to refill. <br />Notes <br />📌 When the service is busy, the speed of starting the process varies. <br />📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
    {
      id: "37",
      name: "❤️ Instagram Likes | Low Drop | Instant Start",
      min: 10,
      max: 30000,
      rate: 199.0,
      description:
        "🔸 Min: 10<br />🔸 Max: 30,000<br />🔸 Link: Instagram Post Link<br />🔸 Quality: Global Users<br />🔸 Drops are generally minimal. There is a day refill guarantee for drops <br />Notes <br />📌 Processing start time may vary during high demand. <br />📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
    {
      id: "38",
      name: "❤️ Instagram Likes | Low Drop | Instant Start",
      min: 10,
      max: 50000,
      rate: 199.0,
      description:
        "🔸 Min: 10<br />🔸 Max: 50,000<br />🔸 Link: Instagram Post Link<br />🔸 Quality: Global Users<br />🔸 Drops are generally minimal. There is a day refill guarantee for drops <br />Notes <br />📌 Processing start time may vary during high demand. <br />📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
    {
      id: "39",
      name: "❤️ Instagram Likes | Low Drop | Instant Start",
      min: 10,
      max: 50000,
      rate: 543.0,
      description:
        "🔸 Min: 10<br />🔸 Max: 50,000<br />🔸 Link: Instagram Post Link<br />🔸 Quality: Global Users<br />🔸 Drops are generally minimal. There is a day refill guarantee for drops <br />Notes <br />📌 Processing start time may vary during high demand. <br />📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
  ],

  "👀 Instagram Views": [
    {
      id: "40",
      name: "👀 Instagram Views | Instant",
      min: 100,
      max: 50000000,
      rate: 11.0,
      description: "Instagram Views | Instant",
    },
    {
      id: "41",
      name: "👀 Instagram Views",
      min: 100,
      max: 2147483647,
      rate: 24.0,
      description: "Instagram Views",
    },
    {
      id: "42",
      name: "👀 Instagram Views | Instant Speed",
      min: 100,
      max: 100000000,
      rate: 189.0,
      description: "Instagram Views | Instant Speed",
    },
    {
      id: "43",
      name: "👀 Instagram Video - Reels Views | Instant Start",
      min: 100,
      max: 100000000,
      rate: 15.0,
      description:
        "🔸 Min: 100<br />🔸 Max: 100.000.000<br />🔸 Link: Video link / Reel Link<br />🔸 Compatible for all formats.<br />Notes:<br />📌 When the service is busy, the speed of starting the process changes.<br />📌 Do not place the second order on the same link before your order is completed in the system.",
    },
  ],

  "📊 Instagram Impressions": [
    {
      id: "44",
      name: "📊 Instagram Impressions",
      min: 10,
      max: 1000000,
      rate: 25.0,
      description:
        " ❗️WARNING ❗️<br />The display only sends to posts. Reels videos are not sent. No refunds or cancellations are provided.<br />Your Instagram account must be a business / professional account.<br />The post must be shared while it was a business / professional account.<br /> Please order by taking this information into consideration.<br />🔸 Min: 10<br />🔸 Max: 1,000,000<br />🔸 Start Time: 0-30 Minutes<br />🔸 Link: Post Link | Reels videos are not accepted.<br />🔸 It may take up to 24 hours to be reflected<br />Notes:<br />📌 The speed at which the service starts varies when it is busy.<br /> 📌 Do not place a 2nd order on the same link before the order you have placed is completed in the system.",
    },
    {
      id: "45",
      name: "📊 Instagram Reach + Impressions | Instant Start",
      min: 10,
      max: 1000000,
      rate: 99.0,
      description:
        " ❗️WARNING ❗️<br />Your Instagram account must be a business or professional account.<br />The post must be shared while the account is a business or professional account.<br />Please take this into consideration when placing your order.<br />🔸 Min: 10<br />🔸 Max: 1,000,000<br />🔸 Start Time: 0-30 Minutes<br />🔸 Link: Post Link -Also provides posting to IGTV and Real Shares.<br />🔸 It may take up to 24 hours to be reflected<br />Notes:<br />📌 The speed at which the service starts varies when it is busy.<br /> 📌 Do not place a 2nd order on the same link before the order you have placed is completed in the system.",
    },
    {
      id: "46",
      name: "📊 Instagram Reach + Impressions | Instant Start",
      min: 10,
      max: 300000,
      rate: 99.0,
      description:
        " ❗️WARNING ❗️<br />Your Instagram account must be a business or professional account.<br />The post must be shared while the account is a business or professional account.<br />Please take this into consideration when placing your order.<br />🔸 Min: 10<br />🔸 Max: 300,000<br />🔸 Start Time: 0-30 Minutes<br />🔸 Link: Post Link -Also Allows posting to IGTV and Real Shares.<br />🔸 It may take up to 24 hours to be reflected<br />Notes:<br />📌 The speed at which the service starts varies when it is busy.<br /> 📌 Do not place a 2nd order on the same link before the order you have placed is completed in the system.",
    },
    {
      id: "47",
      name: "📊 Instagram Reach + Impressions | Instant Start",
      min: 10,
      max: 50000,
      rate: 130.0,
      description:
        " ❗️WARNING ❗️<br />Your Instagram account must be a business or professional account.<br />The post must be shared while the account is a business or professional account.<br />Please take this into consideration when placing your order.<br />🔸 Min: 10<br />🔸 Max: 50,000<br />🔸 Start Time: 0-30 Minutes<br />🔸 Link: Post Link -Also Allows posting to IGTV and Real Shares.<br />🔸 It may take up to 24 hours to be reflected<br />Notes:<br />📌 The speed at which the service starts varies when it is busy.<br /> 📌 Do not place a 2nd order on the same link before the order you have placed is completed in the system.",
    },
    {
      id: "48",
      name: "📊 Instagram Engagement + Shares + Reach + Impressions + Profile Visits",
      min: 10,
      max: 50000,
      rate: 130.0,
      description:
        " ❗️WARNING ❗️<br />Your Instagram account must be a business or professional account.<br />The post must be shared while the account is a business or professional account.<br />Please take this into consideration when placing your order.<br />🔸 Min: 10<br />🔸 Max: 100,000<br />🔸 Link: Post Link<br />🔸 Quality: High Quality <br />🔸 Delivery of interactions takes approximately 45-60 minutes<br />Notes:<br />📌 The speed at which the service starts varies when it is busy.<br /> 📌 Do not place a 2nd order on the same link before the order you have placed is completed in the system.",
    },
  ],

  "👀 Instagram Stories": [
    {
      id: "49",
      name: "👀 Instagram Story Views | All Story | Instant Start",
      min: 10,
      max: 100000,
      rate: 184.0,
      description:
        " 🚨 Only orders with username are processed!<br />🔸 Min: 10<br />🔸 Max: 100,000<br />🔸 Link: Username<br />🔸Quality: Global Users <br />Notes <br />📌 When the service is busy, the processing speed varies. <br /> 📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
    {
      id: "50",
      name: "👀 Instagram Story Views | All Story | Instant Start",
      min: 100,
      max: 50000,
      rate: 198.0,
      description:
        "🔸 Min: 100<br />🔸 Max: 50,000<br />🔸 Link: Username<br />🔸Quality: Global Users <br />🔸Start Time: Starts instantly, completed very quickly <br /> 🔸For orders related to story views services please screenshot with a timestamp for any refund or complaint <br />Notes <br />📌 When the service is busy, the processing speed varies. <br /> 📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
    {
      id: "51",
      name: "👀 Instagram Story Views | All Stories",
      min: 10,
      max: 100000,
      rate: 184.0,
      description: "Instagram Story Views | All Stories",
    },
  ],

  "🔀 Instagram Shares": [
    {
      id: "51",
      name: "🔀 Instagram Post Shares",
      min: 10,
      max: 10000000,
      rate: 25.0,
      description:
        "❗️WARNING ❗️<br />Your Instagram account must be a business/professional account.<br />The post must be shared while the account is in business/professional mode.<br />Please consider this information when placing your order.<br />🔸 Min: 10<br />🔸 Max: 10,000,000<br />🔸 Startup Time: Instant Starts<br />🔸Link: Post Link<br /> Notes:<br />📌 It takes approximately 45-60 minutes for it to be reflected in the 'Instagram Statistics' section.<br />📌 In order to see the increase in the number of shares, your account must be in the business profile. Additionally, your post must be shared while on the business profile. Otherwise, even if the post comes, you will not be able to see it.",
    },
    {
      id: "52",
      name: "🔀 Instagram Post Shares",
      min: 100,
      max: 5000000,
      rate: 239.0,
      description:
        "❗️WARNING ❗️<br />Your Instagram account must be a business/professional account.<br />The post must be shared while the account is in business/professional mode.<br />Please consider this information when placing your order.<br />🔸 Min: 10<br />🔸 Max: 5,000,000<br />🔸 Startup Time: Instant Starts<br />🔸Link: Post Link<br /> Notes:<br />📌 It takes approximately 45-60 minutes for it to be reflected in the 'Instagram Statistics' section.<br />📌 In order to see the increase in the number of shares, your account must be in the business profile. Additionally, your post must be shared while on the business profile. Otherwise, even if the post comes, you will not be able to see it.",
    },
    {
      id: "53",
      name: "🔀 Instagram Post Shares + Engagement | Instant Start",
      min: 100,
      max: 1000000,
      rate: 139.0,
      description:
        "❗️WARNING ❗️<br />Your Instagram account must be a business/professional account.<br />The post must be shared while the account is in business/professional mode.<br />Please consider this information when placing your order.<br />🔸 Min: 10<br />🔸 Max: 5,000,000<br />🔸 Startup Time: Instant Starts<br />🔸Link: Post Link<br /> Notes:<br />📌 It takes approximately 45-60 minutes for it to be reflected in the 'Instagram Statistics' section.<br />📌 In order to see the increase in the number of shares, your account must be in the business profile. Additionally, your post must be shared while on the business profile. Otherwise, even if the post comes, you will not be able to see it.",
    },
    {
      id: "54",
      name: "🔀 Instagram Post Shares + Engagement + Reach | Instant Start",
      min: 10,
      max: 1000000,
      rate: 178.0,
      description:
        "❗️WARNING ❗️<br />Your Instagram account must be a business/professional account.<br />The post must be shared while the account is in business/professional mode.<br />Please consider this information when placing your order.<br />🔸 Min: 10<br />🔸 Max: 5,000,000<br />🔸 Startup Time: Instant Starts<br />🔸Link: Post Link<br /> Notes:<br />📌 It takes approximately 45-60 minutes for it to be reflected in the 'Instagram Statistics' section.<br />📌 In order to see the increase in the number of shares, your account must be in the business profile. Additionally, your post must be shared while on the business profile. Otherwise, even if the post comes, you will not be able to see it.",
    },
    {
      id: "55",
      name: "🔀 Instagram Post Shares + Engagement + Reach | Instant Start",
      min: 100,
      max: 5000000,
      rate: 554.0,
      description:
        "❗️WARNING ❗️<br />Your Instagram account must be a business/professional account.<br />The post must be shared while the account is in business/professional mode.<br />Please consider this information when placing your order.<br />❗️ Reels-based posts are not supported.<br />🔸 Min: 100<br />🔸 Max: 5.000.000<br />🔸 Link: Post Link<br />⚠️ Reels links are not supported!<br />🔸 Quality: High Quality<br />🔸 It takes 45-60 minutes for the posts to bereflected in the post. <br />Notes <br />📌 It is a service to increase the number of shares of your photos or videos.<br />📌 It takes approximately 0-30 minutes to be reflected in the Instagram statistics section<br />📌 Sends with an average speed of 3K-5K per minute.",
    },
  ],

  "🗳️ Instagram Saves": [
    {
      id: "56",
      name: "🗳️ Instagram Saves",
      min: 100,
      max: 400000,
      rate: 97.0,
      description:
        "🔸 Min: 100<br />🔸 Max: 400,000<br />🔸 Link: Post Link<br />🔸 Start Time: Starts Instantly<br />Notes <br />📌 When the service is busy, the processing speed varies.<br/>📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
    {
      id: "57",
      name: "🗳️ Instagram Saves | Instant Start",
      min: 100,
      max: 400000,
      rate: 97.0,
      description:
        "🔸 Min: 100<br />🔸 Max: 400,000<br />🔸 Link: Post Link<br />🔸 Start Time: Starts Instantly<br />Notes <br />📌 When the service is busy, the processing speed varies.<br/>📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
  ],

  "🔀 Instagram Auto Save / Share": [
    {
      id: "58",
      name: "🔀 Instagram Auto Post Shares",
      min: 100,
      max: 10000000,
      rate: 25.0,
      description:
        "❗️WARNING ❗️<br />Your Instagram account must be a business/professional account.<br />The post must be shared while the account is in business/professional mode.<br />Please consider this information when placing your order.<br />🔸 Min: 10<br />🔸 Max: 10,000,000<br />🔸 Startup Time: Instant Starts<br />🔸Link: Post Link<br /> Notes:<br />📌 It takes approximately 45-60 minutes for it to be reflected in the 'Instagram Statistics' section.<br />📌 In order to see the increase in the number of shares, your account must be in the business profile. Additionally, your post must be shared while on the business profile. Otherwise, even if the post comes, you will not be able to see it.",
    },
    {
      id: "59",
      name: "🔀 Instagram Auto Post Shares",
      min: 100,
      max: 5000000,
      rate: 20.0,
      description:
        "❗️WARNING ❗️<br />Your Instagram account must be a business/professional account.<br />The post must be shared while the account is in business/professional mode.<br />Please consider this information when placing your order.<br />🔸 Min: 10<br />🔸 Max: 5,000,000<br />🔸 Startup Time: Instant Starts<br />🔸Link: Post Link<br /> Notes:<br />📌 It takes approximately 45-60 minutes for it to be reflected in the 'Instagram Statistics' section.<br />📌 In order to see the increase in the number of shares, your account must be in the business profile. Additionally, your post must be shared while on the business profile. Otherwise, even if the post comes, you will not be able to see it.",
    },
    {
      id: "60",
      name: "🔀 Instagram Auto Save",
      min: 100,
      max: 400000,
      rate: 99.0,
      description:
        "🔸 Min: 100<br />🔸 Max: 400,000<br />🔸 Link: Username<br />🔸 Start Time: Starts Instantly<br />Notes <br />📌 When the service is busy, the processing speed varies.<br/>📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
    {
      id: "61",
      name: "🔀 Instagram Auto Saves",
      min: 100,
      max: 100000,
      rate: 124.0,
      description:
        "🔸 Min: 100<br />🔸 Max: 100,000<br />🔸 Link: Username<br />🔸 Start Time: Starts Instantly<br />Notes <br />📌 When the service is busy, the processing speed varies.<br/>📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
    {
      id: "62",
      name: "🔀 Instagram Auto Saves",
      min: 20,
      max: 100000,
      rate: 245.0,
      description:
        "🔸 Min: 100<br />🔸 Max: 100,000<br />🔸 Link: Username<br />🔸 Start Time: Starts Instantly<br />Notes <br />📌 When the service is busy, the processing speed varies.<br/>📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
  ],

  "🗳️ Instagram Story Poll Voting": [
    {
      id: "63",
      name: "🗳️ Instagram Story Poll Voting",
      min: 20,
      max: 100000,
      rate: 2447.0,
      description:
        "⚠️ Important Note: When placing orders, specify the vote button to be clicked after the story link with /?vote=(1,2,3,4..).<br />🔸 Min: 20<br />🔸 Max: 100,000<br />🔸 Link: Story Poll Link<br />🔸 Quality: 100% Global Users with Stories<br /> 🔥 The world’s only and highest quality Instagram Global Story View and Poll Voting service.<br />🔥 Most users share stories, have followers generally over 100, and have posts.<br />Notes <br />📌 When the service is busy, the processing speed varies.<br/>📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
  ],

  "🗳️ Instagram Post Poll Votes": [
    {
      id: "63",
      name: "🗳️ Instagram Post Poll Voting",
      min: 20,
      max: 100000,
      rate: 6116.0,
      description:
        "⚠️ Important Note: When placing orders, specify the vote button to be clicked after the story link with /?vote=(1,2,3,4..).<br />🔸 Min: 20<br />🔸 Max: 100,000<br />🔸 Link: Post Link<br />🔸 Quality: 100% Global Users with Stories<br /> 🔥 The world’s only and highest quality Instagram Global Post Poll Voting service.<br />🔥 Most users share stories, have followers generally over 100, and have shares.<br />Notes <br />📌 When the service is busy, the processing speed varies.<br/>📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
  ],

  "🗣️ Instagram Comments": [
    {
      id: "64",
      name: "🗣️ Instagram Custom Mixed Comments | Instant Start",
      min: 1,
      max: 1000,
      rate: 28456.0,
      description:
        "🔸 Min: 1<br />🔸 Max: 1000<br />🔸 Link: Post Link<br />🔸 Quality: 8% Real Users <br /> 🔥 Customizable Comments - 1 Comment Per Line<br />Notes <br />📌 When the service is busy, the processing speed varies.<br/>📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
  ],

  "🗣️ Instagram Emoji Comment": [
    {
      id: "64",
      name: "🗣️ Instagram Random Positive Emoji Comment",
      min: 1,
      max: 1000,
      rate: 3456.0,
      description:
        "🔸 Min: 1<br />🔸 Max: 1000<br />🔸 Link: Post Link<br />🔸 Quality: Global Users <br /> 🔥 Start Time - Beings within 0-1 hours.<br />Notes <br />📌 When the service is busy, the processing speed varies.<br/>📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
  ],

  "❤️ Instagram Comment Likes": [
    {
      id: "65",
      name: "❤️ Instagram Comment Likes | Instant Start",
      min: 10,
      max: 20000,
      rate: 6166.0,
      description:
        "🔸 Min: 10<br />🔸 Max: 20000<br />🔸 Link: Click once on the time of the comment you want to like, copy the link of the page that opens and paste it into the link section.<br />Notes <br />📌 When the service is busy, the processing speed varies.<br/>📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
  ],

  "👥 Instagram Channel Members": [
    {
      id: "66",
      name: "👥 Instagram Channel Members | Instant Start",
      min: 10,
      max: 100000,
      rate: 979.0,
      description:
        "🔸 Min: 10<br />🔸 Max: 100,000<br />🔸 Link: Instagram Channel invitation Link.<br />Notes <br />📌 Sending to private accounts cannot be made. Do not hide your account during the transaction.<br/>📌 Do not place a 2nd order to the same link before your order is completed in the system.",
    },
  ],

  "📊 Instagram Auto Engagement": [],

  "👀 Facebook Livestreams Views": [],

  "👀 Facebook Reels Views": [],

  "👀 Instagram Views": [],

  "🔀 Facebook Post Shares": [],

  "🗣️ Facebook Comments": [],

  "👀 Instagram Live Stream Viewers": [],
  "👥 Threads Followers": [],
  "👥 TikTok Followers": [],
  "❤️ TikTok Likes": [],
  "👀 TikTok Views": [],
  "👀❤️ TikTok Story Likes - Views": [],
  "🔀 TikTok Shares": [],
  "🗣️ TikTok Comments": [],
  "👀 TikTok Livestream Views and Viewers": [],
  "🏆 Tiktok PK Battle": [],
  "👀 ❤️ TikTok Comment Likes": [],
  "🗳️ TikTok Saves": [],
  "👥 Facebook Page Followers": [],
  "👀 ❤️ Facebook Post Likes": [],
  "❤️ Facebook Page Likes": [],
  "❤️ Facebook emoji Likes": [],
  "👥 Facebook Group Members": [],
  "👥 Facebook Profile Followers": [],
  "📦 Facebook Event and Others": [],
  "👥 Twitter Followers": [],
  "❤️ Twitter (X) Likes": [],
  "❤️ Twitter (X) Automatic Likes Packages": [],
  "🔀 Twitter Retweets": [],
  "❤️ Twitter Premium Likes": [],
  "👀 Twitter Views": [],
  "👀 Twitter (X) Live Stream Views": [],
  "🗳️ Twitter (X) Poll Votes": [],
  "📦 Twitter (X) Community Services": [],
  "🎧 Twitter (X) Space Listeners": [],
  "🔖 Twitter (X) Bookmarks": [],
  "🔀 Twitter (X) Share": [],
  "👥 Telegram Members": [],
  "👀 Telegram Post Views": [],
  "🙀 Telegram Post Reactions": [],
  "⤵️ Telegram Post Shares": [],
  "🗳️ Telegram Poll Votes": [],
  "👥 Telegram Online Group / Channel Members": [],
  "🤖 Telegram Bot Starts": [],
  "📦 Snapchat Services": [],

  "📦 LinkedIn Services": [],
  "📦 Whatsapp Services": [],
  "👥 YouTube Subscribers": [],
  "❤️ YouTube Likes": [],
  "👀 YouTube Views": [],
  "👀 YouTube Short Views": [],
  "👀⏱️YouTube WatchTime": [],
  "🗣️ YouTube Comments": [],
  "❤️🗣️ YouTube Comment Likes": [],
  "👎🗣️ YouTube Comment Dislike": [],
  "🔀 YouTube Sharing": [],
  "⏯️ YouTube Livestream Views": [],
  "📦 YouTube Community": [],
};

let selectedCategory = null;
let selectedService = null;

// Initialize dropdowns
function initializeDropdowns() {
  const categoryMenu = document.getElementById("categoryMenu");

  Object.keys(servicesData).forEach((category) => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.textContent = category;
    item.addEventListener("click", () => selectCategory(category));
    categoryMenu.appendChild(item);
  });
}

// Category selection
function selectCategory(category) {
  selectedCategory = category;
  selectedService = null;

  document.getElementById("categoryText").textContent = category;
  document.getElementById("categoryDropdown").classList.remove("active");
  document.getElementById("categoryMenu").classList.remove("show");

  const serviceDropdown = document.getElementById("serviceDropdown");
  serviceDropdown.classList.remove("disabled");
  document.getElementById("serviceText").textContent = "Select a service...";

  populateServices(category);

  resetForm();
}

// Populate services for selected category
function populateServices(category) {
  const serviceMenu = document.getElementById("serviceMenu");
  serviceMenu.innerHTML = "";

  servicesData[category].forEach((service) => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.innerHTML = `${service.name} - NGN ${service.rate.toFixed(
      2
    )} per 1000`;
    item.addEventListener("click", () => selectService(service));
    serviceMenu.appendChild(item);
  });
}

// Service selection
function selectService(service) {
  selectedService = service;

  document.getElementById("serviceText").innerHTML = `${
    service.name
  } - NGN ${service.rate.toFixed(2)} per 1000`;
  document.getElementById("serviceDropdown").classList.remove("active");
  document.getElementById("serviceMenu").classList.remove("show");

  updateForm(service);
}

function updateForm(service) {
  document.getElementById("descriptionText").value =
    service.description.replace(/<br \/>/g, "\n");

  const quantityInput = document.getElementById("orderQuantity");
  quantityInput.min = service.min;
  quantityInput.max = service.max;
  quantityInput.disabled = false;
  quantityInput.value = service.min;

  document.getElementById(
    "quantityRange"
  ).textContent = `Min: ${service.min.toLocaleString()} - Max: ${service.max.toLocaleString()}`;

  document.getElementById("averageTime").value = getAverageTime(service.rate);

  updateCharge();
}

// Reset form
function resetForm() {
  document.getElementById("descriptionText").value = "";
  document.getElementById("orderQuantity").value = "";
  document.getElementById("orderQuantity").disabled = true;
  document.getElementById("quantityRange").textContent =
    "Select a service to see quantity limits";
  document.getElementById("averageTime").value = "Select a service";
  document.getElementById("orderCharge").value = "NGN 0.00";
}

function getAverageTime(rate) {
  if (rate === 0) return "Instant";
  if (rate < 10) return "15-30 minutes";
  if (rate < 50) return "1-2 hours";
  return "2-6 hours";
}

function updateCharge() {
  if (!selectedService) return;

  const quantity =
    parseInt(document.getElementById("orderQuantity").value) || 0;
  const charge = (quantity / 1000) * selectedService.rate;
  document.getElementById("orderCharge").value = `NGN ${charge.toFixed(2)}`;
}

// Dropdown toggle functionality
function setupDropdownToggles() {
  // Category dropdown
  document
    .getElementById("categoryDropdown")
    .addEventListener("click", function () {
      this.classList.toggle("active");
      document.getElementById("categoryMenu").classList.toggle("show");

      document.getElementById("serviceDropdown").classList.remove("active");
      document.getElementById("serviceMenu").classList.remove("show");
    });

  // Service dropdown
  document
    .getElementById("serviceDropdown")
    .addEventListener("click", function () {
      if (this.classList.contains("disabled")) return;

      this.classList.toggle("active");
      document.getElementById("serviceMenu").classList.toggle("show");

      document.getElementById("categoryDropdown").classList.remove("active");
      document.getElementById("categoryMenu").classList.remove("show");
    });
}

document.addEventListener("click", function (e) {
  if (!e.target.closest(".custom-dropdown")) {
    document
      .querySelectorAll(".dropdown-button")
      .forEach((btn) => btn.classList.remove("active"));
    document
      .querySelectorAll(".dropdown-menu")
      .forEach((menu) => menu.classList.remove("show"));
  }
});

document
  .getElementById("orderQuantity")
  .addEventListener("input", updateCharge);

document.getElementById("searchInput").addEventListener("input", function (e) {
  const searchTerm = e.target.value.toLowerCase();
});

document
  .querySelector(".new-order-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    if (!selectedService) {
      alert("Please select a category and service first.");
      return;
    }

    const formData = {
      category: selectedCategory,
      service: selectedService,
      link: document.getElementById("orderLink").value,
      quantity: document.getElementById("orderQuantity").value,
      charge: document.getElementById("orderCharge").value,
    };

    console.log("Order submitted:", formData);
    alert("Order submitted successfully!");
  });

document.addEventListener("DOMContentLoaded", function () {
  initializeDropdowns();
  setupDropdownToggles();
});

//ORDER JS
const sampleOrders = [
  {
    id: "ORD001",
    date: "2025-06-05",
    link: "instagram.com/example",
    charge: "$25.00",
    startCount: "1,250",
    quantity: "1,000",
    service: "Instagram Followers",
    status: "completed",
    remains: "0",
  },
  {
    id: "ORD002",
    date: "2025-06-04",
    link: "youtube.com/watch?v=example",
    charge: "$15.50",
    startCount: "850",
    quantity: "500",
    service: "YouTube Views",
    status: "partial",
    remains: "125",
  },
  {
    id: "ORD003",
    date: "2025-06-03",
    link: "facebook.com/example",
    charge: "$30.00",
    startCount: "2,100",
    quantity: "1,500",
    service: "Facebook Likes",
    status: "processing",
    remains: "750",
  },
];

// DOM elements
const filterTabs = document.querySelectorAll(".filter-tab");
const searchInput = document.getElementById("searchInput");
const orderTableBody = document.getElementById("orderTableBody");
const emptyState = document.getElementById("emptyState");

let currentFilter = "all";
let searchTerm = "";

// Initialize the table
function initializeTable() {
  if (sampleOrders.length > 0) {
    renderOrders(sampleOrders);
    emptyState.style.display = "none";
  } else {
    showEmptyState();
  }
}

// Render orders in the table
function renderOrders(orders) {
  orderTableBody.innerHTML = "";

  if (orders.length === 0) {
    showEmptyState();
    return;
  }

  emptyState.style.display = "none";

  orders.forEach((order) => {
    const row = document.createElement("tr");
    row.innerHTML = `
          <td>${order.id}</td>
          <td>${formatDate(order.date)}</td>
          <td><a href="https://${
            order.link
          }" target="_blank" style="color: var(--primary-color); text-decoration: none;">${truncateLink(
      order.link
    )}</a></td>
          <td>${order.charge}</td>
          <td>${order.startCount}</td>
          <td>${order.quantity}</td>
          <td>${order.service}</td>
          <td><span class="status-badge status-${order.status}">${
      order.status
    }</span></td>
          <td>${order.remains}</td>
      `;
    orderTableBody.appendChild(row);
  });
}

// Show empty state
function showEmptyState() {
  orderTableBody.innerHTML = "";
  emptyState.style.display = "block";
}

// Filter orders
function filterOrders() {
  let filteredOrders = sampleOrders;

  // Apply status filter
  if (currentFilter !== "all") {
    filteredOrders = filteredOrders.filter(
      (order) =>
        order.status === currentFilter ||
        (currentFilter === "in-progress" && order.status === "processing")
    );
  }
  if (searchTerm) {
    filteredOrders = filteredOrders.filter(
      (order) =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.link.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  renderOrders(filteredOrders);
}

// Event listeners for filter tabs
filterTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    filterTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    currentFilter = tab.dataset.filter;
    filterOrders();
  });
});

searchInput.addEventListener("input", (e) => {
  searchTerm = e.target.value;
  filterOrders();
});

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncateLink(link) {
  return link.length > 30 ? link.substring(0, 30) + "..." : link;
}

initializeTable();

//COntact js
document.getElementById("contactForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const form = this;
  const submitButton = form.querySelector(".auth-buttons");
  const successMessage = document.getElementById("successMessage");

  submitButton.textContent = "Sending...";
  submitButton.disabled = true;

  setTimeout(() => {
    successMessage.classList.add("show");

    form.reset();

    submitButton.textContent = "Send Message";
    submitButton.disabled = false;

    setTimeout(() => {
      successMessage.classList.remove("show");
    }, 5000);
  }, 1000);
});

const inputs = document.querySelectorAll("input, textarea");
inputs.forEach((input) => {
  input.addEventListener("blur", function () {
    if (this.hasAttribute("required") && !this.value.trim()) {
      this.style.borderColor = "var(--error-red)";
    } else if (this.type === "email" && this.value && !this.checkValidity()) {
      this.style.borderColor = "var(--error-red)";
    } else {
      this.style.borderColor = "var(--border-color)";
    }
  });

  input.addEventListener("focus", function () {
    this.style.borderColor = "var(--primary-blue)";
  });
});
