var WANTED_WIDTH = 800;
var fullWidth = Math.max([ document.documentElement.clientWidth, document.body ? document.body.scrollWidth : 0, document.documentElement.scrollWidth,
		document.body ? document.body.offsetWidth : 0, document.documentElement.offsetWidth ]);
cssAttributes = arguments[0];

var Counter = /** @class */ (function () {
    function Counter() {
        this.map = {};
    }
    Counter.prototype.increase = function (element) {
        if (element.tagName in this.map) {
            this.map[element.tagName] = this.map[element.tagName] + 1;
        }
        else {
            this.map[element.tagName] = 1;
        }
        return this.map[element.tagName];
    };
    ;
    return Counter;
}());

function getText(node) {
    var firstNode = node.childNodes[0];
    if (firstNode && firstNode.nodeType == node.TEXT_NODE) {
        return firstNode.nodeValue;
    }
    if (node.nodeType == node.TEXT_NODE) {
        return node.nodeValue;
    }
    return "";
}

function getX(node) {
    var rect = node.getBoundingClientRect();
    return rect.left + window.scrollX;
}

function getY(node) {
    var rect = node.getBoundingClientRect();
    return rect.top + window.scrollY;
}

function addCoordinates(extractedAttributes, node) {
    // these attributes need special treatment
    extractedAttributes["absolute-x"] = getX(node) * (WANTED_WIDTH / fullWidth);
    extractedAttributes["absolute-y"] = getY(node) * (WANTED_WIDTH / fullWidth);
    extractedAttributes["absolute-width"] = node.getBoundingClientRect().width * (WANTED_WIDTH / fullWidth);
    extractedAttributes["absolute-height"] = node.getBoundingClientRect().height * (WANTED_WIDTH / fullWidth);
    var parentNode = node.parentNode;
    if (typeof parentNode.getBoundingClientRect === "function") {
        extractedAttributes["x"] = getX(node) - getX(parentNode);
        extractedAttributes["y"] = getY(node) - getY(parentNode);
        extractedAttributes["width"] = node.getBoundingClientRect().width - parentNode.getBoundingClientRect().width;
        extractedAttributes["height"] = node.getBoundingClientRect().height - parentNode.getBoundingClientRect().height;
    }
    else {
        extractedAttributes["x"] = getX(node);
        extractedAttributes["y"] = getY(node);
        extractedAttributes["width"] = node.getBoundingClientRect().width;
        extractedAttributes["height"] = node.getBoundingClientRect().height;
    }
}

// Disabled should only be added for matching nodes
function isDisabled(node) {
    if (!node.disabled) {
        return false;
    }
    if (node.disabled === "") {
        return false;
    }
    if (node.disabled === "disabled") {
        return true;
    }
    return node.disabled ? true : false;
}

//extract *given* CSS style attributes
function getComputedStyleSafely(node) {
    try {
        return window.getComputedStyle(node) || [];
    } catch (err) {}
    return [];
}

function transform(node) {
    var extractedAttributes = {
        "tagName": node.tagName.toLowerCase(),
        "text": getText(node),
        "value": node.value,
        "tab-index": node.tabIndex,
        "shown": isShown(node)
    };
    
    if (node.nodeType == node.TEXT_NODE) {
        addCoordinates(extractedAttributes, node.parentNode);
        return extractedAttributes;
    }

    // extract *all* HTML element attributes
    var attrs = node.attributes;
    for (var i = 0; i < attrs.length; i++) {
        var attributeName = attrs[i].name;
        var attributeValue = attrs[i].value;
        extractedAttributes[attributeName] = attributeValue;
    }
    
    // overwrite empty attributes (e.g. 'disabled')
    extractedAttributes["checked"] = node.checked;
    extractedAttributes["disabled"] = isDisabled(node);
    extractedAttributes["read-only"] = node.readOnly;

    var style = getComputedStyleSafely(node);
    var parentStyle = getComputedStyleSafely(node.parentNode);
    for (var i = 0; i < cssAttributes.length; i++) {
        var attrName = cssAttributes[i];
        if (!extractedAttributes[attrName]) {
            if (parentStyle[attrName] != style[attrName]) {
                extractedAttributes[attrName] = style[attrName];
            }
        }
    }

    addCoordinates(extractedAttributes, node);

    return extractedAttributes;
}

function isShown(e) {
    if (e.nodeType == e.TEXT_NODE) {
        return isShown(e.parentNode);
    }
    return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
}

function isNonEmptyTextNode(node) {
    var nodeValue = (node.nodeValue == null) ? "" : node.nodeValue;
    return node.nodeType == node.TEXT_NODE && nodeValue.trim().length > 0;
}

function containsOtherElements(element) {
    return element.children.length > 0;
}

function getElementXPath(node) {
    var paths = [];
    for ( ; node && node.nodeType == Node.ELEMENT_NODE; node = node.parentNode)  {
        var index = 0;
        for (var sibling = node.previousSibling; sibling; sibling = sibling.previousSibling) {
            if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE) {
                continue;
            }

            if (sibling.nodeName == node.nodeName) {
                ++index;
            }
        }
        var tagName = node.nodeName.toLowerCase();
        var pathIndex = "[" + (index+1) + "]";
        paths.unshift(tagName + pathIndex);
    }

    return paths.length ? "/" + paths.join( "/") : null;
}

function mapElement(element, parentPath, allElements) {
    if (!element || !element.children) {
        return allElements;
    }
    var counter = new Counter();
    for (var i = 0; i < element.childNodes.length; i++) {
        var child = element.childNodes[i];
        if (child.nodeType == child.ELEMENT_NODE ||
            (isNonEmptyTextNode(child) && containsOtherElements(element))) {
            if (child.nodeType == child.TEXT_NODE) {
                child.tagName = "textnode";
            }
            var cnt = counter.increase(child);
            var path = parentPath + "/" + child.tagName.toLowerCase() + "[" + cnt + "]";
            allElements[path] = transform(child);
            mapElement(child, path, allElements);
        }
    }
    return allElements;
}

var rootNode = document.getElementsByTagName("html")[0];
var rootPath = "//html[1]";
if (arguments.length >= 2 && arguments[1]) {
    rootNode = arguments[1];
    rootPath = getElementXPath(rootNode);
}
var root = transform(rootNode);
var allElements = {};
allElements[rootPath] = root;
allElements = mapElement(rootNode, rootPath, allElements);
return allElements;
