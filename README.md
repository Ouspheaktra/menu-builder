# Menu Builder

**Menu Builder** is a javascript library to build the menu. It is simple as it sounds like.

---

## Requirements

* [JQuery](https://github.com/jquery/jquery) (v3.3.1 tested)
* [Bootstrap](https://github.com/twbs/bootstrap) css & js (v4.1.3 tested)
* [Sortable](https://github.com/RubaXa/Sortable) (v1.4.0 tested)



## Usage

```html
<div id="container"></div>
```

```javascript
var container = document.getElementById("container");
new MenuBuilder({ container });
```



### Options

#### `container` option : `HTMLElement`

A container to hold the builder

#### `lang` option : `String[]`

An array of languages.  
Default: `["en", "km", "th", "vn", "kr", "jp", "ch"]`.

#### `data` option : `Object[]`

An array of menu data.

#### `depth` option : `Number`

Maximum depth of menu.
Default: `1` means: can have one-depth submenu.

#### `defaultLang` option : `String`

Set default language.
default: `en`.



### Methods

#### `genJson()` method : `String`

Get JSON string which represent current menu.

#### `impJson(json : String)` method

Import JSON String, and redraw current MenuBuilder.



### Properties

There are some properties, but they're not what you should worry about. They're almost the same as the Options above.