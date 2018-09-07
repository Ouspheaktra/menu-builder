; (function () {
	if (window.jQuery === undefined)
		throw Error("Require JQuery.js: you can have it here: https://code.jquery.com/jquery-3.3.1.min.js")
	if (window.Sortable === undefined)
		throw Error("Require Sortable.js: you can have it here: https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js")

	if (window.MenuBuilder !== undefined)
		return;
	$(document.head).append(
		$("<style>").text(`
	.menu-builder-container-fluid { padding-top: 15px; }
	.sortable-ghost { opacity: .5; }
	.sortable-chosen { background-color: lightblue; }
	.menu-builder-gen-json { position: fixed; bottom: .5em; left: .5em; }
	.menu-builder-imp-json { position: fixed; bottom: .5em; right: .5em; }
	.menu-builder-code { font: 1.2em monospace; }
	.menu-builder-menu-cont {
		margin-top: .5em;
		margin-left: .75em;
	}
	.menu-builder-menu {
		min-height: 25px;
		background: white;
		margin-bottom: .5em;
		border: 1px solid lightgray;
		display: flex;
		flex-direction: column;
		padding-left: 0;
	}
	.menu-builder-menu-item {
		list-style: none;
		padding: .5em;
		border-bottom: 1px solid lightgray; 
	}
	.menu-builder-menu-item:last-of-type { border: none; }
	.menu-builder-btn {
		padding: .5em;
		border: 1px solid lightgray;
	}
	[class^=menu-builder-] { border-radius: 5px; }
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

	function alert(text) {
		let el = $('<div class="alert alert-danger fade show" role="alert">')
			.text(text)
			.css({ position: 'fixed', top: 10, left: 10, right: 10, zIndex: 1000, textAlign: 'center' })
			.append(
				$('<button type="button" class="close" data-dismiss="alert" aria-label="Close">').append(
					$('<span aria-hidden="true">').html('&times;')
				));
		$(document.body).append(el);
		el.alert();
		setTimeout(() => el.alert("close"), 1500);
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
			onChoose: e => setActiveItem($(e.item)),
			onStart: e => $(e.item).find(".menu-builder-menu-cont").first().hide(),
			onEnd: e => $(e.item).children(".menu-builder-menu-cont")[$(e.to).data("depth") >= this.depth ? "hide" : "show"]()
		};

		function selectLang() {
			langSelect
				.find("option")
				.each((_, l) => $(l)[l.value in activeData.name ? "hide" : "show"]())
				.each((_, l) => {
					if (!l.style.display) {
						langSelect.find("select").val(l.value);
						return false;
					}
				})
			return langSelect;
		}

		function createLangInput(lang, text) {
			activeData.name[lang] = text;
			selectLang();
			return $(`<div class='input-group mb-2' id='menu-builder-${number}-${lang}-cont'>`).append(
				$("<div class='input-group-prepend'>").append(
					$(`<label class='input-group-text' for='menu-builder-${number}-${lang}'>`).text(lang)),
				$(`<input type='text' class='form-control' id='menu-builder-${number}-${lang}'>`).val(text)
					.on('input', e => {
						const val = $(e.target).val();
						if (lang === defaultLang)
							setText(activeEl, val);
						activeData.name[lang] = val;
					}),
				$("<div class='input-group-append'>").append(
					$("<button class='btn btn-danger' type='button'>").append(
						$('<span aria-hidden="true">&times;</span>')
					).click(function (e) {
						if (lang !== defaultLang) {
							delete activeData.name[lang];
							$(`#menu-builder-${number}-${lang}-cont`).remove();
							selectLang();
						} else
							alert("Cannot delete default language");
					})
				),
			)
		}

		function setActiveItem(el) {
			activeEl && activeEl.removeClass("active");
			editCont.empty();
			if (!el) return;
			activeEl = el.addClass("active")
			activeData = el.data();
			editCont.append(
				langCont.empty().append(Object.entries(activeData.name).map((one) => createLangInput(...one))),
				selectLang(),
				linkInput
			);
		}

		function newMenuItem(depth = 0, data = { name: { en: `Item-${itemId}`, km: `ទី-${itemId++}` }, link: "" }) {
			let ul = $("<ul class='menu-builder-menu'>")
				.data("depth", depth)
				.append(data.sub && data.sub.map(sub => newMenuItem(depth + 1, sub)));
			new Sortable(ul.get(0), sortableOption);
			let cont =
				$("<div class='menu-builder-menu-cont'>")[depth > this.depth ? "hide" : "show"]().append(
					ul,
					$("<button class='menu-builder-btn'>").css("float", "right").text("Add Menu")
						.click(e => $(e.target).prev().append(newMenuItem(depth + 1)))
				)
			if (depth === 0)
				return cont;
			return setText($(`<li class='menu-builder-menu-item'>`), data.name[defaultLang]).data(data).append(cont);
		}
		newMenuItem = newMenuItem.bind(this);

		function _genJson(menu) {
			let json = [];
			let getSub = menu.data("depth") < this.depth;
			menu.children("li").each((_, li) => {
				let one = $(li).data();
				if (getSub && (one.sub = _genJson($(li).find(".menu-builder-menu").first())) && !one.sub.length)
					delete one.sub
				json.push(one);
			});
			return json;
		}
		_genJson = _genJson.bind(this);

		let menuCont = $("<div>").append(newMenuItem(0));
		let editCont = $('<div>');
		let langCont = $("<div class='ml-3'>")
		let langSelectBtn = $("<button class='btn btn-primary' type='button'>").text("Add");
		langSelectBtn.get(0).addEventListener("click", () => langCont.append(createLangInput(langSelect.find("select").val(), "")))
		let langSelect =
			$("<div class='input-group mb-2'>").append(
				$("<div class='input-group-prepend'>").append(
					$(`<label class='input-group-text' for='menu-builder-${number}-lang-select'>`).text("Language")),
				$(`<select class='custom-select' id='menu-builder-${number}-lang-select'>`).append(lang.map(l => $("<option>").text(l))),
				$("<div class='input-group-append'>").append(langSelectBtn)
			);
		let linkInput =
			$("<div class='input-group mb-2'>").append(
				$("<div class='input-group-prepend'>").append(
					$(`<label class='input-group-text' for='menu-builder-${number}-link'>`).text("Link")),
				$(`<input type='text' class='form-control' id='menu-builder-${number}-link'>`)
					.val(activeData.link)
					.on("input", e => activeData.link = $(e.target).val())
			);

		let genJsonModal =
			$('<div class="modal fade" id="menu-builder-json" tabindex="-1" role="dialog" aria-labelledby="jsonLabel" aria-hidden="true">').append(
				$('<div class="modal-dialog" role="document">').append(
					$('<div class="modal-content">').append(
						$('<div class="modal-header">').append(
							$('<h4 class="modal-title">').text("JSON")),
						$('<div class="modal-body">').append(
							$('<div class="menu-builder-code"></div>'))
					)
				)
			)
		let genJsonBtn =
			$(`<button class="menu-builder-gen-json btn btn-default" type="button" data-toggle="modal" data-target="#${genJsonModal.get(0).id}">`)
				.text("Generate JSON")
				.click(() => genJsonModal.find('.menu-builder-code').text(this.genJson()))
		let impJsonForm =
			$('<form>').append(
				$('<textarea name="json" cols="30" rows="10" class="form-control menu-builder-code mb-2">'),
				$('<input type="submit" class="btn btn-primary">')
			).submit(e => {
				e.preventDefault();
				this.impJson(e.target.json.value);
				e.target.json.value = "";
				$(".modal").click();
			})
		let impJsonModal =
			$('<div class="menu-builder-imp-json modal fade" id="menu-builder-json-form" tabindex="-1" role="dialog" aria-labelledby="jsonLabel" aria-hidden="true">').append(
				$('<div class="modal-dialog" role="document">').append(
					$('<div class="modal-content">').append(
						$('<div class="modal-header">').append(
							$('<h4 class="modal-title">').text("Import JSON")),
						$('<div class="modal-body">').append(
							impJsonForm
						)
					)
				)
			)
		let impJsonBtn = $(`<button class="menu-builder-imp-json btn btn-default" type="button" data-toggle="modal" data-target="#${impJsonModal.get(0).id}">`).text("Import JSON");

		this.genJson = () => JSON.stringify(_genJson(menuCont.find("ul").first()));
		this.impJson = function (jsonString) {
			try {
				let json = JSON.parse(jsonString);
				itemId = 0;
				menuCont.empty()
					.append(newMenuItem(0))
					.find("ul").append(json.map(one => newMenuItem(1, one)))
			} catch (error) {
				if (error.constructor === SyntaxError)
					console.log("Invalid JSON");
				else
					console.error(error)
			}
		}
		var s = new Sortable(menuCont.find("ul").get(0), sortableOption);
		this.container = (container instanceof $ ? container : $(container)).append(
			$("<div>").css("clear", "both").append(
				$("<div class='row'>").append(
					$("<div>").css({width: '50%', float: 'left'}).append(menuCont, genJsonBtn, genJsonModal, impJsonBtn, impJsonModal),
					$("<div>").css({width: '50%', float: 'left'}).append(editCont)
				)
			)
		)

		window.addEventListener("click", e => {
			if (!e.path)
				return;
			let found = false;
			for (let path of e.path)
				if (path === menuCont.get(0) || path === editCont.get(0)) {
					found = true;
					break;
				}
			if (!found)
				setActiveItem(null);
		});

		this.impJson(JSON.stringify(data));

		number++;
	}
	window.MenuBuilder = MenuBuilder;
})();