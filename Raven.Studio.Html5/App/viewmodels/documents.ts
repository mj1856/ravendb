/// <reference path="shell.ts" />
/// <reference path="../../Scripts/typings/knockout.postbox/knockout-postbox.d.ts" />
/// <reference path="../durandal/typings/durandal.d.ts"/>

import http = module("durandal/http");
import app = module("durandal/app");

import database = module("models/database");
import collection = module("models/collection");
import document = module("models/document");

import raven = module("common/raven");
import pagedList = module("common/pagedList");

export class documents { 

	displayName = "documents";
	ravenDb: raven;
    collections = ko.observableArray<collection>();
	selectedCollection = ko.observable<collection>().subscribeTo("ActivateCollection");
	allDocumentsCollection: collection;
	collectionColors = []
	private currentCollectionPagedItems = ko.observable<pagedList>();

	constructor() {
		this.ravenDb = new raven();
		this.ravenDb
			.collections() 
			.then(results => this.collectionsLoaded(results));

		this.selectedCollection.subscribe(c => this.onSelectedCollectionChanged(c));
	}
	
    collectionsLoaded(collections: collection[]) {
        // Set the color class for each of the collections.
        // These styles are found in app.less.
        var collectionStyleCount = 7;
        collections.forEach((c, index) => c.colorClass = "collection-style-" + (index % collectionStyleCount));

        // Create the "All Documents" pseudo collection.
        this.allDocumentsCollection = new collection("All Documents");
		this.allDocumentsCollection.colorClass = "all-documents-collection";
		<any>this.allDocumentsCollection.documentCount = ko.computed(() => this.collections()
			.filter(c => c !== this.allDocumentsCollection) // Don't include self, the all documents collection.
            .map(c => c.documentCount()) // Grab the document count of each.
            .reduce((first, second) => { return first + second }, 0)); // And sum them up.

        // All systems a-go. Load them into the UI and select the first one.
        var allCollections = [this.allDocumentsCollection].concat(collections);
		this.collections(allCollections);
		this.allDocumentsCollection.activate();

		// Fetch the collection info for each collection.
		// The collection info contains information such as total number of documents.
		collections.forEach(c => this.fetchTotalDocuments(c));
	}

	fetchTotalDocuments(collection: collection) {
		this.ravenDb
			.collectionInfo(collection.name)
			.then(info => collection.documentCount(info.totalResults));
	}

	onSelectedCollectionChanged(selected: collection) {
		if (collection) {
			var fetcher = (skip: number, take: number) => {
				var collectionName = selected !== this.allDocumentsCollection ? selected.name : null;
				return this.ravenDb.documents(collectionName, skip, take);
			};

			var documentsList = new pagedList(fetcher, 30)
			this.currentCollectionPagedItems(documentsList);
		}
	}
}