class Input extends HTMLElement {
  handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    this.setAttribute("value", target.value);
    this.dispatchEvent(new Event("change", { bubbles: true }));
  };

  static get observedAttributes() {
    return ["value", "placeholder", "type", "label", "required", "disabled", "hint"];
  }

  attributeChangedCallback() {
    this.render();
  }

  connectedCallback() {
    this.render();
    this.querySelector("input")?.addEventListener("change", this.handleChange);
  }

  disconnectedCallback() {
    this.querySelector("input")?.removeEventListener("change", this.handleChange);
  }

  render() {
    const id = crypto.randomUUID();
    const label = this.getAttribute("label");
    const hint = this.getAttribute("hint");
    const isRequired = this.hasAttribute("required");
    const isDisabled = this.hasAttribute("disabled");

    this.innerHTML = `
      <div class="flex flex-col gap-2">
        ${label ? `<label for="${id}" class="font-medium">${label}${isRequired ? ` <span class="text-destructive">*</span>` : ""}</label>` : ""}
        <input
          id="${id}"
          placeholder="${this.getAttribute("placeholder") || ""}"
          value="${this.getAttribute("value") || ""}"
          type="${this.getAttribute("type") || "text"}"
          class="ipt${isDisabled ? " bg-foreground" : ""}"
          ${isRequired ? "required" : ""}
          ${isDisabled ? "disabled" : ""}
        />
        ${hint ? `<span class="text-text-secondary text-sm">${hint}</span>` : ""}
      </div>
    `;
  }
}

customElements.define("app-input", Input);
