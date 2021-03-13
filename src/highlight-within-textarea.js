const HighlightWithinTextarea = function(el, config) {
  this.init(el, config);
};

HighlightWithinTextarea.prototype = {
  ID: 'hwt',

  init: function(el, config) {
    this.el = el;

    if (this.getType(config) === 'custom') {
      this.highlight = config;
      this.generate();
    } else {
      console.error('valid config object not provided');
    }
  },

  // returns identifier strings that aren't necessarily "real" JavaScript types
  getType: function(instance) {
    let type = typeof instance;
    if (!instance) {
      return 'falsey';
    } else if (Array.isArray(instance)) {
      if (instance.length === 2 && typeof instance[0] === 'number' &&
          typeof instance[1] === 'number') {
        return 'range';
      } else {
        return 'array';
      }
    } else if (type === 'object') {
      if (instance instanceof RegExp) {
        return 'regexp';
      } else if (instance.hasOwnProperty('highlight')) {
        return 'custom';
      }
    } else if (type === 'function' || type === 'string') {
      return type;
    }

    return 'other';
  },

  generate: function() {
    this.el.classList.add(this.ID + '-input', this.ID + '-content');

    this.el.addEventListener('input', this.handleInput.bind(this));
    this.el.addEventListener('scroll', this.handleScroll.bind(this));

    this.highlights = document.createElement('div');
    this.highlights.classList.add(this.ID + '-highlights',
        this.ID + '-content');

    this.backdrop = document.createElement('div');
    this.backdrop.classList.add(this.ID + '-backdrop');
    this.backdrop.append(this.highlights);

    this.container = document.createElement('div');
    this.container.classList.add(this.ID + '-container');
    this.el.parentNode.insertBefore(this.container, this.el.nextSibling);

    this.container.append(this.backdrop);
    this.container.append(this.el); // moves el into container

    this.container.addEventListener('scroll',
        this.blockContainerScroll.bind(this));

    this.browser = this.detectBrowser();
    switch (this.browser) {
      case 'firefox':
        this.fixFirefox();
        break;
      case 'ios':
        this.fixIOS();
        break;
    }

    // plugin function checks this for success
    this.isGenerated = true;

    // trigger input event to highlight any existing input
    this.handleInput();
  },

  // browser sniffing sucks, but there are browser-specific quirks to handle
  // that are not a matter of feature detection
  detectBrowser: function() {
    let ua = window.navigator.userAgent.toLowerCase();
    if (ua.indexOf('firefox') !== -1) {
      return 'firefox';
    } else if (!!ua.match(/msie|trident\/7|edge/)) {
      return 'ie';
    } else if (!!ua.match(/ipad|iphone|ipod/) &&
        ua.indexOf('windows phone') === -1) {
      // Windows Phone flags itself as "like iPhone", thus the extra check
      return 'ios';
    } else {
      return 'other';
    }
  },

  // Firefox doesn't show text that scrolls into the padding of a textarea, so
  // rearrange a couple box models to make highlights behave the same way
  fixFirefox: function() {

    const hl = window.getComputedStyle(this.highlights, null);
    // take padding and border pixels from highlights div
    let padding = {
      'padding-top': parseInt(hl.getPropertyValue('padding-top')),
      'padding-right': parseInt(hl.getPropertyValue('padding-right')),
      'padding-bottom': parseInt(hl.getPropertyValue('padding-bottom')),
      'padding-left': parseInt(hl.getPropertyValue('padding-left')),
    };

    let border = {
      'border-top-width': parseInt(hl.getPropertyValue('border-top-width')),
      'border-right-width': parseInt(hl.getPropertyValue('border-right-width')),
      'border-bottom-width': parseInt(
          hl.getPropertyValue('border-bottom-width')),
      'border-left-width': parseInt(hl.getPropertyValue('border-left-width')),
    };

    this.highlights.style.padding = '0';
    this.highlights.style.borderWidth = '0';

    const bdStyle = window.getComputedStyle(this.backdrop, null);

    const bdMarginTopOldValue = parseInt(
        bdStyle.getPropertyValue('margin-top'));
    const bdMarginRightOldValue = parseInt(
        bdStyle.getPropertyValue('margin-right'));
    const bdMarginBottomOldValue = parseInt(
        bdStyle.getPropertyValue('margin-bottom'));
    const bdMarginLeftOldValue = parseInt(
        bdStyle.getPropertyValue('margin-left'));

    this.backdrop.style.marginTop = bdMarginTopOldValue +
        padding['padding-top'] + border['border-top-width'] + 'px';

    this.backdrop.style.marginRight = bdMarginRightOldValue +
        padding['padding-right'] + border['border-right-width'] + 'px';

    this.backdrop.style.marginBottom = bdMarginBottomOldValue +
        padding['padding-bottom'] + border['border-bottom-width'] + 'px';

    this.backdrop.style.marginLeft = bdMarginLeftOldValue +
        padding['padding-left'] + border['border-left-width'] + 'px';
  },

  // iOS adds 3px of (unremovable) padding to the left and right of a textarea,
  // so adjust highlights div to match
  fixIOS: function() {
    const paddingLeftOldValue = parseInt(this.highlights.style.paddingLeft);
    this.highlights.style.paddingLeft = (paddingLeftOldValue + 3) + 'px';

    const paddingRightOldValue = parseInt(this.highlights.style.paddingRight);
    this.highlights.style.paddingRight = (paddingRightOldValue + 3) + 'px';
  },

  handleInput: function() {
    let input = this.el.value;
    let ranges = this.getRanges(input, this.highlight);
    let unstaggeredRanges = this.removeStaggeredRanges(ranges);
    let boundaries = this.getBoundaries(unstaggeredRanges);
    this.renderMarks(boundaries);
  },

  getRanges: function(input, highlight) {
    let type = this.getType(highlight);
    switch (type) {
      case 'array':
        return this.getArrayRanges(input, highlight);
      case 'function':
        return this.getFunctionRanges(input, highlight);
      case 'regexp':
        return this.getRegExpRanges(input, highlight);
      case 'string':
        return this.getStringRanges(input, highlight);
      case 'range':
        return this.getRangeRanges(input, highlight);
      case 'custom':
        return this.getCustomRanges(input, highlight);
      default:
        if (!highlight) {
          // do nothing for falsey values
          return [];
        } else {
          console.error('unrecognized highlight type');
        }
    }
  },

  getArrayRanges: function(input, arr) {
    let ranges = arr.map(this.getRanges.bind(this, input));
    return Array.prototype.concat.apply([], ranges);
  },

  getFunctionRanges: function(input, func) {
    return this.getRanges(input, func(input));
  },

  getRegExpRanges: function(input, regex) {
    let ranges = [];
    let match;
    while (match = regex.exec(input), match !== null) {
      ranges.push([match.index, match.index + match[0].length]);
      if (!regex.global) {
        // non-global regexes do not increase lastIndex, causing an infinite loop,
        // but we can just break manually after the first match
        break;
      }
    }
    return ranges;
  },

  getStringRanges: function(input, str) {
    let ranges = [];
    let inputLower = input.toLowerCase();
    let strLower = str.toLowerCase();
    let index = 0;
    while (index = inputLower.indexOf(strLower, index), index !== -1) {
      ranges.push([index, index + strLower.length]);
      index += strLower.length;
    }
    return ranges;
  },

  getRangeRanges: function(input, range) {
    return [range];
  },

  getCustomRanges: function(input, custom) {
    let ranges = this.getRanges(input, custom.highlight);
    if (custom.className) {
      ranges.forEach(function(range) {
        // persist class name as a property of the array
        if (range.className) {
          range.className = custom.className + ' ' + range.className;
        } else {
          range.className = custom.className;
        }
      });
    }
    return ranges;
  },

  // prevent staggered overlaps (clean nesting is fine)
  removeStaggeredRanges: function(ranges) {
    let unstaggeredRanges = [];
    ranges.forEach(function(range) {
      let isStaggered = unstaggeredRanges.some(function(unstaggeredRange) {
        let isStartInside = range[0] > unstaggeredRange[0] && range[0] <
            unstaggeredRange[1];
        let isStopInside = range[1] > unstaggeredRange[0] && range[1] <
            unstaggeredRange[1];
        return isStartInside !== isStopInside; // xor
      });
      if (!isStaggered) {
        unstaggeredRanges.push(range);
      }
    });
    return unstaggeredRanges;
  },

  getBoundaries: function(ranges) {
    let boundaries = [];
    ranges.forEach(function(range) {
      boundaries.push({
        type: 'start',
        index: range[0],
        className: range.className,
      });
      boundaries.push({
        type: 'stop',
        index: range[1],
      });
    });

    this.sortBoundaries(boundaries);
    return boundaries;
  },

  sortBoundaries: function(boundaries) {
    // backwards sort (since marks are inserted right to left)
    boundaries.sort(function(a, b) {
      if (a.index !== b.index) {
        return b.index - a.index;
      } else if (a.type === 'stop' && b.type === 'start') {
        return 1;
      } else if (a.type === 'start' && b.type === 'stop') {
        return -1;
      } else {
        return 0;
      }
    });
  },

  renderMarks: function(boundaries) {
    let input = this.el.value;
    boundaries.forEach(function(boundary, index) {
      let markup;
      if (boundary.type === 'start') {
        markup = '{{hwt-mark-start|' + index + '}}';
      } else {
        markup = '{{hwt-mark-stop}}';
      }
      input = input.slice(0, boundary.index) + markup +
          input.slice(boundary.index);
    });

    // this keeps scrolling aligned when input ends with a newline
    input = input.replace(/\n({{hwt-mark-stop}})?$/, '\n\n$1');

    // encode HTML entities
    input = input.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    if (this.browser === 'ie') {
      // IE/Edge wraps whitespace differently in a div vs textarea, this fixes it
      input = input.replace(/ /g, ' <wbr>');
    }

    // replace start tokens with opening <mark> tags with class name
    input = input.replace(/{{hwt-mark-start\|(\d+)}}/g,
        function(match, subMatch) {
          const className = boundaries[+subMatch].className;
          if (className) {
            return '<mark class="' + className + '">';
          } else {
            return '<mark>';
          }
        });

    // replace stop tokens with closing </mark> tags
    input = input.replace(/{{hwt-mark-stop}}/g, '</mark>');

    this.highlights.innerHTML = input;
  },

  handleScroll: function() {
    this.backdrop.scrollTop = this.el.scrollTop;

    // Chrome and Safari won't break long strings of spaces, which can cause
    // horizontal scrolling, this compensates by shifting highlights by the
    // horizontally scrolled amount to keep things aligned
    let scrollLeft = this.el.scrollLeft;

    if (scrollLeft > 0) {
      this.backdrop.style.transform = 'translateX(' + -scrollLeft + 'px)';
    } else {
      this.backdrop.style.transform = '';
    }
  },

  // in Chrome, page up/down in the textarea will shift stuff within the
  // container (despite the CSS), this immediately reverts the shift
  blockContainerScroll: function() {
    this.container.scrollLeft = 0;
  },

  destroy: function() {
    this.container.parentElement.replaceChild(this.el, this.container);
    this.el.classList.remove(this.ID + '-content', this.ID + '-input');
  },
};