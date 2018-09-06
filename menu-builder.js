; (function () {
	if (window.jQuery === undefined)
		throw Error("Require JQuery.js: you can have it here: https://code.jquery.com/jquery-3.3.1.min.js")
	if (window.bootstrap === undefined)
		throw Error("Require Bootstrap.js: you can have it here: https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js")
	if (window.Sortable === undefined)
		throw Error("Require Sortable.js: you can have it here: https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js")

	if (window.MenuBuilder !== undefined)
		return;
	$(document.head).append(
		$("<style>").text(`
	.container-fluid { padding-top: 15px; }
	.sortable-ghost { opacity: .5; }
	.sortable-chosen { background-color: lightblue; }
	.menu-builder-gen-json {
		position: fixed;
		bottom: .5em;
		left: .5em;
	}
	.menu-builder-imp-json {
		position: fixed;
		bottom: .5em;
		right: .5em;
	}
	.code { font: 1.2em monospace; }
	.menu-builder-submenu { min-height: 25px; background: white; }
	.menu-builder-submenu-item { padding: 6px 10px;}
	`))

	function setText(el, text) {
		let node = el.contents().get(0);
		if (text === "")
			text = "[NO NAME]";
		if (node && node.constructor === Text)
			node.nodeValue = text;
		else
			el.append(text);
	}

	let number = 0;

	function MenuBuilder({
		container,
		lang = ["en", "km", "th", "vn", "kr", "jp", "ch"],
		data = [{ name: { en: "Menu" }, link: "" }]
	}) {
		container = container instanceof $ ? container : $(container);
		let self = this;
		this.container = container;
		let indData = {};
		let itemId = 0;
		let activeEl = null;

		this.genJson = function () {
			let json = [];
			menuCont.children("li").each((_, li) => {
				let one = $(li).data();
				one.sub = [];
				$(li).find("li").each((_, subli) => one.sub.push($(subli).data()));
				if (!one.sub.length)
					delete one.sub
				json.push(one);
			});
			return JSON.stringify(json);
		}
		this.impJson = function (jsonString) {
			try {
				let json = JSON.parse(jsonString);
				itemId = 0;
				menuCont.children("li").remove();
				menuCont.children("button").before(json.map(one => newMenuItem(false, one)));
			} catch (error) {
				if (error.constructor === SyntaxError)
					console.log("Invalid JSON");
			}
		}

		function selectLang() {
			langSelect
				.find("option")
				.each((_, l) => $(l)[l.value in indData.name ? "hide" : "show"]())
				.each((_, l) => {
					if (!l.style.display) {
						langSelect.find("select").val(l.value);
						return false;
					}
				})
			return langSelect;
		}

		function createLangInput(lang, text) {
			indData.name[lang] = text;
			selectLang();
			return $(`<div class='input-group mb-2' id='menu-builder-${number}-${lang}-cont'>`).append(
				$("<div class='input-group-prepend'>").append(
					$(`<label class='input-group-text' for='menu-builder-${number}-${lang}'>`).text(lang)),
				$(`<input type='text' class='form-control' id='menu-builder-${number}-${lang}'>`).val(text)
					.on('input', e => {
						const val = $(e.target).val();
						if (lang === "en")
							setText(activeEl, val);
						indData.name[lang] = val;
					}),
				$("<div class='input-group-append'>").append(
					$("<button class='btn btn-danger' type='button'>").append(
						$('<span aria-hidden="true">&times;</span>')
					).click(function (e) {
						if (lang !== 'en') {
							delete indData.name[lang];
							$(`#menu-builder-${number}-${lang}-cont`).remove();
							selectLang();
						}
					})
				),
			)
		}

		function setActiveItem(el) {
			activeEl && activeEl.removeClass("active");
			editCont.empty();
			if (!el) return;
			activeEl = el.addClass("active")
			indData = el.data();
			editCont.append(
				langCont.empty().append(Object.entries(indData.name).map((one) => createLangInput(...one))),
				selectLang(),
				linkInput
			);
		}

		function newMenuItem(submenu = false, d = {}) {
			d = (Object.keys(d).length ? { ...d } : { name: { en: `Item-${itemId++}` }, link: "" });
			let ul =
				$("<ul class='menu-builder-submenu list-group mb-2 border rounded'>").append(
					d.sub && d.sub.map(sub => newMenuItem(true, sub)));
			new Sortable(ul.get(0), sortableOption);
			return $(`<li class='list-group-item list-group-item-action ${submenu ? 'menu-builder-submenu-item' : ''}'>`).text(d.name.en).data(d).append(
				$("<div class='menu-builder-submenu-cont mt-2 ml-3'>")[submenu ? "hide" : "show"]().append(
					ul,
					$("<button class='btn btn-default btn-sm float-right'>").text("Add Submenu")
						.click(function () {
							$(this)
								.prev()
								.append(newMenuItem(true))
						})
				)
			);
		}

		let menuCont =
			$('<ul class="list-group mb-2">').append(
				$('<button class="btn btn-primary" type="button">')
					.text("Add Menu")
					.click(e => $(e.target).before(newMenuItem()))
			)
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
					.val(indData.link)
					.on("input", e => indData.link = $(e.target).val())
			);

		let genJsonModal =
			$('<div class="modal fade" id="menu-builder-json" tabindex="-1" role="dialog" aria-labelledby="jsonLabel" aria-hidden="true">').append(
				$('<div class="modal-dialog" role="document">').append(
					$('<div class="modal-content">').append(
						$('<div class="modal-header">').append(
							$('<h4 class="modal-title">').text("JSON")),
						$('<div class="modal-body">').append(
							$('<div class="code"></div>'))
					)
				)
			)
		let genJsonBtn =
			$(`<button class="menu-builder-gen-json btn btn-default" type="button" data-toggle="modal" data-target="#${genJsonModal.get(0).id}">`)
				.text("Generate JSON")
				.click(() => genJsonModal.find('.code').text(this.genJson()))
		let impJsonForm =
			$('<form>').append(
				$('<textarea name="json" cols="30" rows="10" class="form-control code mb-2">'),
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

		var sortableOption = {
			group: "menu-builder",
			onChoose: e => setActiveItem($(e.item)),
			onStart: e => $(e.item).find(".menu-builder-submenu-cont").hide(),
			onEnd: e => {
				let isSubmenu = $(e.to).hasClass("menu-builder-submenu");
				$(e.item)[`${isSubmenu ? "add" : "remove"}Class`]("menu-builder-submenu-item")
					.find(".menu-builder-submenu-cont")[isSubmenu ? "hide" : "show"]();
			}
		};

		var s = new Sortable(menuCont.get(0), sortableOption);

		container.addClass("container-fluid").append(
			$("<div class='row'>").append(
				$("<div class='col-6'>").append(menuCont, genJsonBtn, genJsonModal, impJsonBtn, impJsonModal),
				$("<div class='col-6'>").append(editCont)
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