/**
 * @typedef {Object} CreateOptions
 * @property {Object<string,string>} [attr] - HTML attributes
 * @property {Object<string,string>} [data] - data-* attributes
 * @property {Object} [private] - Private fields/properties
 * @property {string} [text] - Text content
 * @property {string | HTMLElement | DocumentFragment} [html] - InnerHTML or child
 * @property {Array<HTMLElement>} [children] - Child elements
 * @property {EventListenerOrEventListenerObject} [on] - Event listeners {click: fn}
 */

/**
 * Factory for typed HTML elements with private data
 * @param {string} tag
 * @param {CreateOptions | string | null} [options]
 * @returns {HTMLElement}
 */
export function h(tag, options = {}) {
  const el = document.createElement(tag);

  // String options → className
  if (typeof options === "string") {
    el.className = options;
    return el;
  }

  // Attributes
  const {
    attr = {},
    data = {},
    private: priv = {},
    text,
    html,
    children = [],
    on = {},
  } = options;

  Object.entries(attr).forEach(([k, v]) => el.setAttribute(k, v));
  Object.entries(data).forEach(([k, v]) => el.setAttribute(`data-${k}`, v));

  // Private fields (hidden, enumerable false)
  Object.entries(priv).forEach(([k, v]) => {
    Object.defineProperty(el, `_${k}`, {
      value: v,
      writable: true,
      enumerable: false,
      configurable: true,
    });
  });

  // Content
  if (text) el.textContent = text;
  if (html) {
    if (typeof html === "string") el.innerHTML = html;
    else if (html instanceof HTMLElement || html instanceof DocumentFragment) {
      el.appendChild(html);
    }
  }
  children.forEach((child) => el.appendChild(child));

  // Events
  Object.entries(on).forEach(([event, handlerOrSettings]) => {
    let handler = handlerOrSettings;
    let options = {};

    if (typeof handlerOrSettings === "object" && handlerOrSettings.handler) {
      handler = handlerOrSettings.handler;
      options = handlerOrSettings.options || {};
    }

    el.addEventListener(event, handler, options);
  });

  return el;
}

// Usage examples:
// /** @type {HTMLElement} */
// const el = h("div", {
//   attr: { id: "foo", tabindex: "0" },
//   data: { path: "/bar", type: "file" },
//   private: {
//     run: () => console.log("k"),
//     data: { hidden: true },
//   },
//   text: "Hello",
//   on: {
//     click: () => el._run(),
//     keydown: (e) => console.log(e.key),
//   },
// });

// Access private: el._run() → 'k'
// Data attrs: el.dataset.path → '/bar'

/**
 * @typedef {Object} ReactiveProps
 * @property {any} [color]
 * @property {boolean} [isActive]
 * @property {number} [strength]
 */

/**
 * @param {TemplateStringsArray} strings
 * @param {ReactiveProps} props - Explicit props for reactivity tracking
 * @returns {HTMLElement & ReactiveProps}
 */
export function html(strings, ...args) {
  const markup = String.raw({ raw: strings }, ...args);
  const el = h("div", { html: markup }).firstElementChild;

  return el;
}
