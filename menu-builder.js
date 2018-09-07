; (function () {
	if (window.jQuery === undefined)
		throw Error("Require JQuery.js: you can have it here: https://code.jquery.com/jquery-3.3.1.min.js")
	if (window.Sortable === undefined)
		throw Error("Require Sortable.js: you can have it here: https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js")

	if (window.MenuBuilder !== undefined)
		return;
	$(document.head).append(
		$("<style>").text(`
	.menu-builder-input-group > *,
	.menu-builder-form > textarea,
	.menu-builder-block-inner,
	.menu-builder-menu-item,
	.menu-builder-btn
	{ padding: .5em; }

	.menu-builder-input-group,
	.menu-builder-menu,
	.menu-builder-btn
	{ border: 1px solid lightgray; }

	.menu-builder-form > textarea,
	.menu-builder-input-group,
	.menu-builder-block-inner,
	.menu-builder-menu,
	.menu-builder-btn
	{ border-radius: 5px; }

	.menu-builder { display: flex; }
	.menu-builder * { box-sizing: border-box; font-size: 1em; }
	.menu-builder h4 { font-size: 1.3em; margin: 1em 0; }
	.menu-builder > div { width: 50%; padding: 10px; }
	.menu-builder-active { background: lightblue; }
	.menu-builder-transparent { opacity: .5; }
	.menu-builder-gen-json { position: fixed; bottom: .5em; left: .5em; }
	.menu-builder-imp-json { position: fixed; bottom: .5em; right: .5em; }
	.menu-builder-code { font: 1.2em monospace; }
	.menu-builder-menu-cont { margin-left: 1em; margin-top: .25em; }
	.menu-builder-menu-cont > button { float: right; }
	.menu-builder-menu {
		background: white;
		min-height: 25px;
		display: flex;
		flex-direction: column;
		padding: 0;
		margin: 0 0 .5em 0;
	}
	.menu-builder-menu-item { list-style: none; border-bottom: 1px solid lightgray; }
	.menu-builder-menu-item:last-of-type { border: none; }
	.menu-builder-input-group { display: flex; margin-bottom: .5em; }
	.menu-builder-input-group > * { border: none; }
	.menu-builder-input-group > :nth-child(1) { background: lightgray; }
	.menu-builder-input-group > :nth-child(2) { flex-grow: 2; }
	.menu-builder-input-group > :nth-child(3) { padding-left: 1em; padding-right: 1em; }
	.menu-builder-block { background: rgba(0,0,0,.5); position: fixed; top:0; left:0; right:0; bottom:0; width:auto !important; z-index:1000; }
	.menu-builder-block-inner { width: 50%; position: absolute; top:40%; left:50%; transform: translate(-50%, -50%); background: white; }
	.menu-builder-block-inner > div { padding: .5em 0; }
	.menu-builder-form { display: flex; flex-direction: column; }
	`))

	function setText(el, text) {
		let node = el.contents().get(0);
		if (text === "" || text === undefined)
			text = "[NO TITLE]";
		if (node && node.constructor === Text)
			node.nodeValue = text;
		else
			el.prepend(text);
		return el;
	}

	function createModal(parent, el, title) {
		return parent.append(
			$("<div class='menu-builder-block'>").append(
				$("<div class='menu-builder-block-inner'>").append(
					$("<h4>").text(title),
					$("<hr>"),
					$("<div>").append(el)
				)
			).click(e => (e.currentTarget === e.target) ? $(e.target).remove() : true)
		)
	}

	let number = 0;

	function MenuBuilder({
		container,
		defaultLang = "km",
		lang = ["km", "en", "th", "vn", "kr", "jp", "ch"],
		data = [{ name: { en: "Home", km: "ទំព័រ​ដើម" }, link: "" }],
		depth = 1,
	}) {
		if (this === window)
			return new MenuBuilder(...arguments);
		if (lang.indexOf(defaultLang) < 0)
			throw Error(`defaultLang:'${defaultLang}' does not exist in lang:[${lang}]`)
		this.defaultLang = defaultLang;
		this.depth = depth;
		this.lang = lang;
		let itemId = 0;
		let activeData = {};
		let activeEl = null;
		let sortableOption = {
			group: "menu-builder",
			ghostClass: "menu-builder-transparent",
			onChoose: e => setActiveItem($(e.item)),
			onStart: e => $(e.item).children().hide(),
			onEnd: e => $(e.item).children()[$(e.to).data("depth") >= this.depth ? "hide" : "show"]()
		};

		function selectLang() {
			langSelect.find("option")
				.each((_, l) => $(l)[l.value in activeData.name ? "hide" : "show"]())
				.each((_, l) => l.style.display ? true : (langSelect.find("select").val(l.value) && false))
			return langSelect;
		}

		function createLangInput(lang, text) {
			activeData.name[lang] = text;
			selectLang();
			return $(`<div class='menu-builder-input-group''>`).append(
				$(`<label for='menu-builder-${number}-${lang}'>`).text(lang),
				$(`<input type='text' id='menu-builder-${number}-${lang}'>`).val(text)
					.on('input', e => {
						const val = $(e.target).val();
						(lang === defaultLang) && setText(activeEl, val);
						activeData.name[lang] = val;
					}),
				$("<button type='button'>").text("X").css({ fontFamily: "monospace", background: "red" })
					.click(function (e) {
						if (lang !== defaultLang) {
							delete activeData.name[lang];
							$(e.target).parent().remove();
							selectLang();
						} else
							alert("Cannot delete default language");
					}),
			)
		}

		const setActiveItem = el => {
			activeEl && activeEl.removeClass("menu-builder-active");
			this.editCont.empty();
			if (!el) return;
			activeEl = el.addClass("menu-builder-active")
			activeData = el.data();
			this.editCont.append(
				langCont.empty().append(Object.entries(activeData.name).map((one) => createLangInput(...one))),
				selectLang(),
				linkInput
			);
		}

		const newMenuItem = (depth = 0, data = { name: { en: `Item-${itemId}`, km: `ទី-${itemId++}` }, link: "" }) => {
			let ul = $("<ul class='menu-builder-menu'>").data("depth", depth)
				.append(data.sub && data.sub.map(sub => newMenuItem(depth + 1, sub)));
			new Sortable(ul.get(0), sortableOption);
			let cont =
				$("<div class='menu-builder-menu-cont'>")[depth > this.depth ? "hide" : "show"]().append(
					ul,
					$("<button class='menu-builder-btn'>").text("Add Menu")
						.click(e => $(e.target).prev().append(newMenuItem(depth + 1))),
					$("<div>").css("clear", "both"))
			return (depth === 0) ? cont.css("margin", 0) : setText($(`<li class='menu-builder-menu-item'>`), data.name[defaultLang]).data(data).append(cont);
		}

		const _genJson = menu => {
			let json = [];
			let getSub = menu.data("depth") < this.depth;
			menu.children("li").each((_, li) => {
				let one = $(li).data();
				getSub && (one.sub = _genJson($(li).find(".menu-builder-menu").first())) && !one.sub.length && (delete one.sub);
				json.push(one);
			});
			return json;
		}

		this.menuCont = $("<div>").append(newMenuItem(0));
		this.editCont = $('<div>');
		let langCont = $("<div>").css("padding-left", "1em");
		let langSelectBtn = $("<button type='button'>").text("Add");
		langSelectBtn.get(0).addEventListener("click", () => langCont.append(createLangInput(langSelect.find("select").val(), "")))
		let langSelect =
			$("<div class='menu-builder-input-group'>").append(
				$(`<label for='menu-builder-${number}-lang-select'>`).text("Language"),
				$(`<select id='menu-builder-${number}-lang-select'>`).append(lang.map(l => $("<option>").text(l))),
				langSelectBtn);
		let linkInput =
			$("<div class='menu-builder-input-group'>").append(
				$(`<label for='menu-builder-${number}-link'>`).text("Link"),
				$(`<input type='text' id='menu-builder-${number}-link'>`)
					.val(activeData.link)
					.on("input", e => activeData.link = $(e.target).val()));

		this.genJsonBtn =
			$('<button class="menu-builder-btn" type="button">')
				.text("Generate JSON")
				.click(() => createModal(this.container.children(".menu-builder"), $("<div class='menu-builder-code'>").text(this.genJson()), "JSON"))

		this.impJsonBtn =
			$('<button class="menu-builder-btn" type="button">')
				.text("Import JSON")
				.click(() => createModal(
					this.container.children(".menu-builder"),
					$('<form class="menu-builder-form">').append(
						$('<textarea class="menu-builder-code" name="json" cols="30" rows="10" placeholder="JSON here">'),
						$('<input class="menu-builder-btn" type="submit">')
					).submit(e => e.preventDefault() || this.impJson(e.target.json.value) || $(e.target).parents(".menu-builder-block").click()),
					"Import JSON"));

		this.genJson = () => JSON.stringify(_genJson(this.menuCont.find("ul").first()));
		this.impJson = (jsonString) => {
			try {
				let json = JSON.parse(jsonString);
				itemId = 0;
				this.menuCont.empty()
					.append(newMenuItem(0))
					.find("ul").append(json.map(one => newMenuItem(1, one)))
			} catch (error) {
				if (error.constructor === SyntaxError)
					console.log("Invalid JSON");
				else
					console.error(error)
			}
		}
		var s = new Sortable(this.menuCont.find("ul").get(0), sortableOption);
		this.container = (container instanceof $ ? container : $(container)).append(
			$("<div class='menu-builder'>").append(
				$("<div>").append(this.menuCont, this.genJsonBtn, this.impJsonBtn.css("margin-left", ".5em")),
				$("<div>").append(this.editCont)))

		window.addEventListener("click", e => {
			if (!e.path) return;
			let found = false;
			for (let path of e.path)
				if (path === this.menuCont.get(0) || path === this.editCont.get(0)) {
					found = true;
					break;
				}
			!found && setActiveItem(null);
		});

		this.impJson(JSON.stringify(data));

		number++;
	}
	window.MenuBuilder = MenuBuilder;
})();