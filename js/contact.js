(function () {
  var form = document.getElementById("contact-form");
  if (!form) return;

  var statusEl = document.getElementById("contact-form-status");
  var submitBtn = document.getElementById("contact-submit");

  function setStatus(type, message) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.className = "form-status form-status--" + type;
    statusEl.textContent = message;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (form.website && form.website.value) {
      setStatus("success", "Thanks. We will be in touch soon.");
      form.reset();
      return;
    }

    var name = (form.name.value || "").trim();
    var email = (form.email.value || "").trim();
    var company = (form.company.value || "").trim();
    var message = (form.message.value || "").trim();

    if (!name || !email || !message) {
      setStatus("error", "Please fill in your name, email, and message.");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }
    setStatus("info", "Sending your message...");

    fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: name,
        email: email,
        company: company,
        message: message,
        website: form.website ? form.website.value : "",
      }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data && result.data.ok) {
          setStatus(
            "success",
            result.data.message || "Thanks. Your message was sent to business@mittalsols.com."
          );
          form.reset();
          return;
        }
        setStatus(
          "error",
          (result.data && result.data.error) ||
            "Something went wrong. Please email business@mittalsols.com."
        );
      })
      .catch(function () {
        setStatus(
          "error",
          "Network error. Please email business@mittalsols.com directly."
        );
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send message";
        }
      });
  });
})();
