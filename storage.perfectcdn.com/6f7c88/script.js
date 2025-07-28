const signUpForm = document.getElementById("sign-up-form");
const signInForm = document.getElementById("sign-in-form");
const dashboard = document.querySelector(".dashboard");
const usernameNav = document.getElementById("username-nav");
const usernameSpan = document.getElementById("username");

let users = JSON.parse(localStorage.getItem("users")) || [];

// Sign Up Logic
if (signUpForm) {
  signUpForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Check for existing users
    if (users.some((user) => user.email === email)) {
      alert("Email already used!");
      return;
    }

    if (users.some((user) => user.name === name)) {
      alert("Name already used!");
      return;
    }

    // Create new user
    const user = { name, email, password };
    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));
    alert("Sign up successful! You can now sign in.");
    window.location.href = "signin.html"; // Redirect to sign in page
  });
}

// Sign In Logic
if (signInForm) {
  signInForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const user = users.find(
      (user) => user.email === email && user.password === password
    );

    if (!user) {
      alert("Invalid email or password!");
      return;
    }

    // Show dashboard
    dashboard.style.display = "block";
    usernameSpan.textContent = user.name;
    usernameNav.textContent = user.name;
    signInForm.reset();
  });
}

// Load users from local storage
if (localStorage.getItem("users")) {
  users = JSON.parse(localStorage.getItem("users"));
}
