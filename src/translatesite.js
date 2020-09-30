class EUXTranslate {
	constructor(userParams) {
		const defaultParams = {
			selectorButtonTranslate: '[data-transite-btn]',
			selectorElementTranslate: '[data-transite-key]',
			selectorAttrTranslate: '[data-transite-attr]',
			langset: document.querySelector('html').getAttribute('lang') || 'en',
			id: undefined,
			background: false, // If true, charge language package  but not execute translate function.
			languagePackageLocation: undefined, // Define URL (absolute or relative) of JSON file that contain languages package
			ajaxRequestParams: {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			},
			// Method for notify when the site start to translate the site.
			NotifyPackageLoad: function () {
				console.log('Load package, wait please');
			},
			// Define a any function that execute when the translate finished.
			translatingDone: function () {
				console.log('Translate success.');
			}
		};

		// Define language package without JSON file
		this.dataLanguage = userParams.replaceData || null;

		// Merge default parameters with the user parameters
		this.prms = { ...defaultParams, ...userParams };

		//
		if (this.prms.id) (window.transite = {}), (window.transite[this.prms.id] = this.transite.bind(this));

		//
		if (!this.prms.languagePackageLocation && !this.dataLanguage)
			throw 'Parameter "languagePackageLocation" is not defined';

		// Init translate
		this.addEvents();
		this.pipeLoadPackageLanguage();
	}

	// Method for apply the events to buttons that going to translate the site
	addEvents() {
		document.querySelectorAll(this.prms.selectorButtonTranslate).forEach((elem) => {
			elem.addEventListener('click', (event) => {
				const getValue = event.target.getAttribute(this.prms.selectorButtonTranslate.replace(/\[|\]/g, ''));
				localStorage.langset = getValue;

				this.pipeLoadPackageLanguage();
				event.preventDefault();
			});
		});
	}

	// Method for knows when load language package
	async pipeLoadPackageLanguage() {
		if (this.prms.langset !== localStorage.langset && localStorage.hasOwnProperty('langset')) {
			this.prms.langset = localStorage.langset;

			if (!this.dataLanguage) {
				!this.prms.background ? this.prms.NotifyPackageLoad() : null;

				this.dataLanguage = await fetch(
					this.prms.languagePackageLocation,
					this.prms.ajaxRequestParams
				).then((response) => response.json());

				!this.background ? this.loopAndTranslateDOM() : null;
			} else if (!this.prms.background) {
				this.loopAndTranslateDOM();
			}
		}
	}

	// Method for get text from downloaded language package
	getText(key, inx) {}

	// Loop through the DOM and transalte
	loopAndTranslateDOM() {
		const Elements = document.querySelectorAll(
			`${this.prms.selectorElementTranslate}, ${this.prms.selectorAttrTranslate}`
		);
		const clearSelector = this.prms.selectorElementTranslate.replace(/\[|\]/g, '');
		const clearSelectorAttr = this.prms.selectorAttrTranslate.replace(/\[|\]/g, '');

		Elements.forEach((element) => {
			if (element.hasAttribute(clearSelectorAttr)) {
				const translateAttrib = element.getAttribute(clearSelectorAttr).split('|');
				element.setAttribute(translateAttrib[0], this.coreTranslate(translateAttrib[1]));
			} else {
				element.innerHTML = this.coreTranslate(element.getAttribute(clearSelector));
			}
		});

		this.prms.translatingDone();
	}

	// Method core transalte
	coreTranslate(key = '') {
		const splitKey = key.split('.'),
			splitKeyLong = splitKey.length;
		let getText = null;

		for (let i = 0; i < splitKeyLong; i++) {
			let currentKey = !isNaN(splitKey[i]) ? +splitKey[i] : splitKey[i];
			getText = !getText ? this.dataLanguage[currentKey] : getText[currentKey];

			if (i === 0 && getText) {
				getText = getText[this.prms.langset];
				currentKey = this.prms.langset;
			}

			if (!getText) {
				i = splitKeyLong;
				getText = `Key ${currentKey} undefined`;
			}
		}

		return getText;
	}
}
