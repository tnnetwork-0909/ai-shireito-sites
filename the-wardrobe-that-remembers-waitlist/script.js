const signupForm = document.getElementById("signup-form");

signupForm?.addEventListener("submit", (event) => {
  const action = signupForm.getAttribute("action") ?? "";
  if (!action.includes("{{")) return;

  event.preventDefault();
  document.getElementById("form-status").textContent =
    "Sign-up is not open yet. Please check back when this page is published.";
});
