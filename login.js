// login.js — LOGIN USING CUSTOM USERS TABLE (PLAIN TEXT PASSWORDS)

import { supabase } from "./supabaseClient.js";


document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    // Fetch user by email
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .limit(1);

    if (error) {
      console.error(error);
      alert("Database error. Try again.");
      return;
    }

    if (!users || users.length === 0) {
      alert("No user found with this email.");
      return;
    }

    const user = users[0];

    // Compare plain text password
    if (user.password_hash !== password) {
      alert("Incorrect password.");
      return;
    }

    // Login success
    alert("Login successful!");

    // Redirect based on email or create a role field later
    if (user.email === "mahin@mail.com") {
      window.location.href = "owner-dashboard.html";
    } else if (user.email === "admin@mail.com") {
      window.location.href = "dashboard.html";
    } else {
      window.location.href = "user-home.html";
    }
  });
});
