; (function () {
	if (window.jQuery === undefined)
		throw Error("Require JQuery.js: you can have it here: https://code.jquery.com/jquery-3.3.1.min.js")
	if (window.Sortable === undefined)
		throw Error("Require Sortable.js: you can have it here: https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js")
	if (window.MenuBuilder !== undefined)
		return;

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

	function showModal({ parent, el, title }) {
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
		let activeItem = null;
		let sortableOption = {
			group: "menu-builder",
			ghostClass: "menu-builder-transparent",
			onChoose: e => setActiveItem($(e.item)),
			onStart: e => $(e.item).children().hide(),
			onEnd: e => $(e.item).children()[$(e.to).data("depth") >= this.depth ? "hide" : "show"]()
		};

		// prepare lanugage selection
		const prepareLangSelect = () => {
			langSelect.find("option")
				.each((_, l) => $(l)[l.value in activeItem.data("name") ? "hide" : "show"]())
				.each((_, l) => l.style.display ? true : (langSelect.find("select").val(l.value) && false))
			return langSelect;
		}

		// Create Language Input in Edit
		const createEditLangInput = (lang, text) => {
			activeItem.data("name")[lang] = text;
			prepareLangSelect();
			return $(`<div class='menu-builder-input-group''>`)
				.append(
					$(`<label for='menu-builder-${number}-${lang}'>`)
						.text(lang),
					$(`<input type='text' id='menu-builder-${number}-${lang}'>`)
						.val(text)
						.on('input', e => {
							const val = $(e.target).val();
							(lang === defaultLang) && setText(activeItem, val);
							activeItem.data("name")[lang] = val;
						}),
					$("<button type='button'>")
						.text("X")
						.css({ fontFamily: "monospace", background: "red" })
						.click(e => {
							if (lang !== defaultLang) {
								delete activeItem.data("name")[lang];
								$(e.target).parent().remove();
								prepareLangSelect();
							} else
								alert("Cannot delete default language");
						}),
				)
		}

		// set Active Item
		const setActiveItem = (el) => {
			if (activeItem)
				activeItem.removeClass("menu-builder-active");
			this.editContainer.empty();
			if (!el) return;
			activeItem = el.addClass("menu-builder-active")
			this.editContainer.append(
				editLangContainer
					.empty()
					.append(Object.entries(activeItem.data("name")).map((one) => createEditLangInput(...one))),
				prepareLangSelect(),
				$("<div class='menu-builder-input-group'>").append(
					$(`<label for='menu-builder-${number}-link'>`).text("Link"),
					$(`<input type='text' id='menu-builder-${number}-link'>`)
						.val(activeItem.data("link"))
						.on("input", e => activeItem.data("link", $(e.target).val())))
			);
		}

		// create Menu Item
		const createMenuItem = (depth = 0, data = { name: { en: `Item-${itemId}`, km: `ទី-${itemId++}` }, link: "" }) => {
			let ul = $("<ul class='menu-builder-menu'>")
				.data("depth", depth)
				.append(data.sub && data.sub.map(sub => createMenuItem(depth + 1, sub)));
			new Sortable(ul.get(0), sortableOption);
			let cont =
				$("<div class='menu-builder-menu-cont'>")[depth > this.depth ? "hide" : "show"]()
					.append(
						ul,
						$("<button class='menu-builder-btn'>")
							.text("Add Menu")
							.click(e => $(e.target).prev().append(createMenuItem(depth + 1))),
						$("<div>")
							.css("clear", "both"))
			if (depth === 0)
				return cont.css("margin", 0);
			return setText($(`<li class='menu-builder-menu-item'>`), data.name[defaultLang])
				.data(data)
				.append(cont);
		}

		// to generate JSON
		const _generateJson = (menu) => {
			let json = [];
			let getSubItem = menu.data("depth") < this.depth;
			menu.children("li").each((_, li) => {
				let one = $(li).data();
				if (getSubItem) {
					one.sub = _generateJson($(li).find(".menu-builder-menu").first());
					if (!one.sub.length)
						delete one.sub;
				}
				json.push(one);
			});
			return json;
		}

		// menu
		this.menuContainer = $("<div>").append(createMenuItem(0));
		this.editContainer = $('<div>');
		let editLangContainer = $("<div>").css("padding-left", "1em");

		// lanugage selection
		let langSelectAddBtn = $("<button type='button'>").text("Add");
		let langSelect =
			$("<div class='menu-builder-input-group'>").append(
				$(`<label for='menu-builder-${number}-lang-select'>`).text("Language"),
				$(`<select id='menu-builder-${number}-lang-select'>`).append(lang.map(l => $("<option>").text(l))),
				langSelectAddBtn);
		langSelectAddBtn
			.get(0)
			.addEventListener("click", () =>
				editLangContainer.append(
					createEditLangInput(langSelect.find("select").val(), "")
				)
			)

		// button to generate JSON
		this.generateJsonBtn =
			$('<button class="menu-builder-btn" type="button">')
				.text("Generate JSON")
				.click(() =>
					showModal({
						parent: this.container.children(".menu-builder"),
						el: $("<div class='menu-builder-code'>").text(this.generateJson()),
						title: "JSON"
					})
				)

		// button to import JSON
		this.importJsonBtn =
			$('<button class="menu-builder-btn" type="button">')
				.text("Import JSON")
				.click(() => showModal({
					parent: this.container.children(".menu-builder"),
					el: $('<form class="menu-builder-form">')
						.append(
							$('<textarea class="menu-builder-code" name="json" cols="30" rows="10" placeholder="JSON here">'),
							$('<input class="menu-builder-btn" type="submit">'))
						.submit(e => {
							e.preventDefault();
							this.importJson(e.target.json.value);
							$(e.target).parents(".menu-builder-block").click();
						}),
					title: "Import JSON"
				}));

		// to generate JSON
		this.generateJson = () => JSON.stringify(_generateJson(this.menuContainer.find("ul").first()));

		// to import JSON
		this.importJson = (jsonString) => {
			try {
				let json = JSON.parse(jsonString);
				itemId = 0;
				this.menuContainer
					.empty()
					.append(createMenuItem(0))
					.find("ul").append(json.map(one => createMenuItem(1, one)))
			} catch (error) {
				if (error.constructor === SyntaxError)
					console.log("Invalid JSON");
				else
					console.error(error)
			}
		}

		// add everything into container
		this.container = (container instanceof $ ? container : $(container)).append(
			$("<div class='menu-builder'>").append(
				$("<div>").append(this.menuContainer, this.generateJsonBtn, this.importJsonBtn.css("margin-left", ".5em")),
				$("<div>").append(this.editContainer)))

		new Sortable(this.menuContainer.find("ul").get(0), sortableOption);

		// import data
		this.importJson(JSON.stringify(data));

		// click on somewhere else, hide edit
		window.addEventListener("click", e => {
			if (!e.path) return;
			let found = false;
			for (let path of e.path)
				if (path === this.menuContainer.get(0) || path === this.editContainer.get(0)) {
					found = true;
					break;
				}
			!found && setActiveItem(null);
		});

		number++;
	}
	window.MenuBuilder = MenuBuilder;
})();