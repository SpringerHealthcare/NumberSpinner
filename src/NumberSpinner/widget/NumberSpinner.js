/*global logger*/
/*
    NumberSpinner
    ========================

    @file      : NumberSpinner.js
    @version   : 1.0.0
    @author    : Phil Waterhouse
    @date      : 10/11/2016
    @copyright : Springer 2016
    @license   : Apache 2

    Documentation
    ========================
    Widget containing an input field that acts as a spinner with up and down arrows to the right of the textbox
    to increase and decrease the data sources attribute. Spinner increments are integer only.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",

    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",

    "NumberSpinner/lib/jquery-1.11.2",
    "dojo/text!NumberSpinner/widget/template/NumberSpinner.html",
    "dijit/form/NumberSpinner"

], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, dojoLang, dojoText, dojoHtml, dojoEvent, _jQuery, widgetTemplate
            , dijitNumberSpinner) {
    "use strict";

    var $ = _jQuery.noConflict(true);

    // Declare widget's prototype.
    return declare("NumberSpinner.widget.NumberSpinner", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // DOM elements
        inputNodes: null,
        colorSelectNode: null,
        colorInputNode: null,
        infoTextNode: null,

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: null,
        _contextObj: null,
        _alertDiv: null,
        _readOnly: false,
        _mySpinner: null,

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
            logger.debug(this.id + ".constructor");
            this._handles = [];
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
            logger.debug(this.id + ".postCreate");

            // adjust the template based on the display settings.
            if( this.showLabel ) {
              if(this.formOrientation === "horizontal"){
                // width needs to be between 1 and 11
                var spinnerLabelWidth = this.labelWidth < 1 ? 1 : this.labelWidth;
                spinnerLabelWidth = this.labelWidth > 11 ? 11 : this.labelWidth;

                var spinnerControlWidth = 12 - spinnerLabelWidth,
                    spinnerLabelClass = 'col-sm-' + spinnerLabelWidth,
                    spinnerControlClass = 'col-sm-' + spinnerControlWidth;

                dojoClass.add(this.numberSpinnerLabel, spinnerLabelClass);
                dojoClass.add(this.numberSpinnerControlContainer, spinnerControlClass);
              }

              this.numberSpinnerLabel.innerHTML = this.fieldCaption;
            }
            else {
              dojoClass.remove(this.numberSpinnerMainContainer, "form-group");
              dojoConstruct.destroy(this.numberSpinnerLabel);
            }

            this._updateRendering();
            this._setupEvents();
        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function (obj, callback) {
            logger.debug(this.id + ".update");

            var self = this;
            this._contextObj = obj;

            this._mySpinner = new dijitNumberSpinner({
                value: this._contextObj.get(this.valueAttribute),
                smallDelta: this.smallDelta,
                largeDelta: this.largeDelta,
                constraints: { min:this.minValue, max:this.maxValue, places:0 },
                id: "spinner_" + this.id,
                "class": "form-control",
                invalidMessage: this.invalidMessage,
                intermediateChanges: true
              }, this.numberSpinnerContainer );


            this._mySpinner.on("change", function(value){
              if(value != undefined){
                  self._contextObj.set(self.valueAttribute, value);
              }
            })

            this._resetSubscriptions();
            mendix.lang.nullExec(callback);
        },

        // mxui.widget._WidgetBase.enable is called when the widget should enable editing. Implement to enable editing if widget is input widget.
        enable: function () {
          logger.debug(this.id + ".enable");
        },

        // mxui.widget._WidgetBase.enable is called when the widget should disable editing. Implement to disable editing if widget is input widget.
        disable: function () {
          logger.debug(this.id + ".disable");
        },

        // mxui.widget._WidgetBase.resize is called when the page's layout is recalculated. Implement to do sizing calculations. Prefer using CSS instead.
        resize: function (box) {
          logger.debug(this.id + ".resize");
        },

        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function () {
          logger.debug(this.id + ".uninitialize");
            // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
        },

        // We want to stop events on a mobile device
        _stopBubblingEventOnMobile: function (e) {
            logger.debug(this.id + "._stopBubblingEventOnMobile");
            if (typeof document.ontouchstart !== "undefined") {
                dojoEvent.stop(e);
            }
        },

        // Attach events to HTML dom elements
        _setupEvents: function () {
            logger.debug(this.id + "._setupEvents");
        },

        // Rerender the interface.
        _updateRendering: function (callback) {
            logger.debug(this.id + "._updateRendering");

           if (this._contextObj !== null) {
              this._mySpinner.set("value", this._contextObj.get(this.valueAttribute), false);
            }
            // Important to clear all validations!
            this._clearValidations();

            // The callback, coming from update, needs to be executed, to let the page know it finished rendering
            mendix.lang.nullExec(callback);
        },

        // Handle validations.
        _handleValidation: function(validations) {
            logger.debug(this.id + "._handleValidation");

          this._clearValidations();

          var validation = validations[0],
              message = validation.getReasonByAttribute(this.valueAttribute);

          if (this.readOnly) {
            validation.removeAttribute(this.valueAttribute);
          } else {
            if (message) {
              this._addValidation(message);
              validation.removeAttribute(this.valueAttribute);
            }
          }
        },

        // Clear validations.
        _clearValidations: function() {
            logger.debug(this.id + "._clearValidations");
          dojoConstruct.destroy(this._alertDiv);
          this._alertDiv = null;
          dojoClass.remove(this.numberSpinnerControlContainer, "has-error");
        },

        // Show an error message.
        _showError: function(message) {
            logger.debug(this.id + "._showError");
          if (this._alertDiv !== null) {
              dojoHtml.set(this._alertDiv, message);
            return true;
          }
          this._alertDiv = dojoConstruct.create("div", {
              "class": "alert alert-danger mx-validation-message",
              "innerHTML": message
          });
          dojoConstruct.place(this._alertDiv, this.numberSpinnerControlContainer);
          dojoClass.add(this.numberSpinnerControlContainer, "has-error");
        },

        // Add a validation.
        _addValidation: function(message) {
            logger.debug(this.id + "._addValidation");
          this._showError(message);
        },

        _unsubscribe: function () {
          if (this._handles) {
              dojoArray.forEach(this._handles, function (handle) {
                  mx.data.unsubscribe(handle);
              });
              this._handles = [];
          }
        },

        // Reset subscriptions.
        _resetSubscriptions: function () {
            logger.debug(this.id + "._resetSubscriptions");
          // Release handles on previous object, if any.
          this._unsubscribe();

          // When a mendix object exists create subscribtions.
          if (this._contextObj) {
            var objectHandle = mx.data.subscribe({
                  guid: this._contextObj.getGuid(),
                  callback: dojoLang.hitch(this, function (guid) {
                    this._updateRendering();
                  })
            });

            var attrHandle = mx.data.subscribe({
                  guid: this._contextObj.getGuid(),
                  attr: this.valueAttribute,
                  callback: dojoLang.hitch(this, function (guid) {
                    this._updateRendering();
                  })
            });

            var validationHandle = mx.data.subscribe({
                  guid: this._contextObj.getGuid(),
                  val: true,
                  callback: dojoLang.hitch(this, this._handleValidation)
            });

            this._handles = [ objectHandle, attrHandle, validationHandle ];
          }
        }
    });
});

require(["NumberSpinner/widget/NumberSpinner"]);
