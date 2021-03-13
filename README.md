# Highlight in Textarea

[![npm version](https://badge.fury.io/js/highlight-in-textarea.svg)](https://badge.fury.io/js/highlight-in-textarea)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/masterWeber/highlight-in-textarea/main/LICENSE)
[![npm](https://img.shields.io/npm/dt/highlight-in-textarea)](https://npmcharts.com/compare/highlight-in-textarea?interval=30&log=false&minimal=true)

Library for highlighting bits of text within a textarea.
Port of a [plugin](https://github.com/lonekorean/highlight-within-textarea) for jQuery to pure JS.

## Introduction

It's not actually possible to style text in a textarea, because any markup within a textarea is treated as literal text. This plugin aims to fake it, allowing you to highlight pieces of text inside a textarea.

A native textarea element is used and familiar behavior (auto-correct, scrolling, resizing, etc.) works as expected.

## Usage

To start, create an instance of `HighlightInTextarea`, passing in an element, and a config object.

```javascript
const hit = new HighlightInTextarea('.my-textarea', {
  highlight: whatever // string, regexp, array, function, or custom object
});
```
or
```javascript
const el = document.querySelector('.my-textarea');
const hit = new HighlightInTextarea(el, {
  highlight: whatever // string, regexp, array, function, or custom object
});
```


The `highlight` property accepts several types of values to describe what will be highlighted. You can see the various ways to highlight things, along with example code, on **[the demo page](https://masterweber.github.io/highlight-in-textarea/)**.

## Styling

For reference, **[the demo page](https://masterweber.github.io/highlight-in-textarea/)** has some sample styling (view source to see the CSS).

There are some guidelines for getting your styles in the right places. Here are the classes you'll want to use.

### .hit-container

Use for visibility, positioning, and background.
- `display`
- `position`
- `top`
- `left`
- `margin`
- `background`

### .hit-content

Use for sizing and text formatting.
- `width`
- `height`
- `padding`
- `border`
- `color`
- `font`

### .hit-content mark

Use for highlighted text. Generally, stuff that doesn't change size is fine.
- `background-color`
- `border-radius`
- `box-shadow`

Changes to `color` won't be visible, since text in the textarea covers colored text in the highlights.

## Destroying

You can remove the plugin from a textarea with this.

```javascript
const hit = new HighlightInTextarea('.my-textarea', {
  highlight: whatever // string, regexp, array, function, or custom object
});

hit.destroy();
```
