import getKeyphraseCount from "../../../src/languageProcessing/researches/keywordCount";
import Paper from "../../../src/values/Paper.js";
import factory from "../../specHelpers/factory";
import Mark from "../../../src/values/Mark";
import wordsCountHelper from "../../../src/languageProcessing/languages/ja/helpers/wordsCharacterCount";
import matchWordsHelper from "../../../src/languageProcessing/languages/ja/helpers/matchTextWithWord";
import memoizedSentenceTokenizer from "../../../src/languageProcessing/helpers/sentence/memoizedSentenceTokenizer";
import japaneseMemoizedSentenceTokenizer from "../../../src/languageProcessing/languages/ja/helpers/memoizedSentenceTokenizer";
import buildTree from "../../specHelpers/parse/buildTree";

/**
 * Adds morphological forms to the mock researcher.
 *
 * @param {Array} keyphraseForms The morphological forms to be added to the researcher.
 *
 * @returns {Researcher} The mock researcher with added morphological forms.
 */
const buildMorphologyMockResearcher = function( keyphraseForms ) {
	return factory.buildMockResearcher( {
		morphology: {
			keyphraseForms: keyphraseForms,
		},
	}, true, false, false, { memoizedTokenizer: memoizedSentenceTokenizer } );
};

const testCases = [
	{
		description: "counts/marks a string of text with an occurrence of the keyphrase in it.",
		paper: new Paper( "<p>a string of text with the keyword in it</p>", { keyword: "keyword" } ),
		keyphraseForms: [ [ "keyword", "keywords" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( { marked: "a string of text with the <yoastmark class='yoast-text-mark'>keyword</yoastmark> in it",
				original: "a string of text with the keyword in it",
				position: {
					startOffset: 29,
					endOffset: 36,
					startOffsetBlock: 26,
					endOffsetBlock: 33,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
	{
		description: "counts a string of text with no occurrence of the keyphrase in it.",
		paper: new Paper( "<p>a string of text</p>", { keyword: "" } ),
		keyphraseForms: [],
		expectedCount: 0,
		expectedMarkings: [],
		skip: false,
	},
	{
		description: "counts multiple occurrences of a keyphrase consisting of multiple words.",
		paper: new Paper( "<p>a string of text with the key word in it, with more key words.</p>", { keyword: "key word" } ),
		keyphraseForms: [ [ "key", "keys" ], [ "word", "words" ] ],
		expectedCount: 2,
		expectedMarkings: [
			new Mark( {
				marked: "a string of text with the <yoastmark class='yoast-text-mark'>key word</yoastmark> in it, " +
					"with more <yoastmark class='yoast-text-mark'>key words</yoastmark>.",
				original: "a string of text with the key word in it, with more key words.",
				position: {
					startOffset: 29,
					endOffset: 37,
					startOffsetBlock: 26,
					endOffsetBlock: 34,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
			new Mark( {
				marked: "a string of text with the <yoastmark class='yoast-text-mark'>key word</yoastmark> in it, " +
					"with more <yoastmark class='yoast-text-mark'>key words</yoastmark>.",
				original: "a string of text with the key word in it, with more key words.",
				position: {
					startOffset: 55,
					endOffset: 64,
					startOffsetBlock: 52,
					endOffsetBlock: 61,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
	{
		description: "counts a string with multiple occurrences of keyphrase with different morphological forms",
		paper: new Paper( "<p>A string of text with a keyword and multiple keywords in it.</p>", { keyword: "keyword" } ),
		keyphraseForms: [ [ "keyword", "keywords" ] ],
		expectedCount: 2,
		expectedMarkings: [
			new Mark( {
				marked: "A string of text with a <yoastmark class='yoast-text-mark'>keyword</yoastmark> " +
				"and multiple <yoastmark class='yoast-text-mark'>keywords</yoastmark> in it.",
				original: "A string of text with a keyword and multiple keywords in it.",
				position: {
					startOffset: 27,
					endOffset: 34,
					startOffsetBlock: 24,
					endOffsetBlock: 31,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
			new Mark( {
				marked: "A string of text with a <yoastmark class='yoast-text-mark'>keyword</yoastmark> " +
					"and multiple <yoastmark class='yoast-text-mark'>keywords</yoastmark> in it.",
				original: "A string of text with a keyword and multiple keywords in it.",
				position: {
					startOffset: 48,
					endOffset: 56,
					startOffsetBlock: 45,
					endOffsetBlock: 53,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
	{
		description: "does not match keyphrase occurrence in image alt attribute.",
		paper: new Paper( "<p>A text with <img src='http://image.com/image.jpg' alt='image' /></p>", { keyword: "image" } ),
		keyphraseForms: [ [ "image", "images" ] ],
		expectedCount: 0,
		expectedMarkings: [],
		skip: false,
	},
	{
		description: "also matches same phrase with different capitalization.",
		paper: new Paper( "<p>A string with KeY worD.</p>", { keyword: "key word" } ),
		keyphraseForms: [ [ "key", "keys" ], [ "word", "words" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				marked: "A string with <yoastmark class='yoast-text-mark'>KeY worD</yoastmark>.",
				original: "A string with KeY worD.",
				position: {
					startOffset: 17,
					endOffset: 25,
					startOffsetBlock: 14,
					endOffsetBlock: 22,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
	{
		description: "doesn't count keyphrase instances inside elements we want to exclude from the analysis",
		paper: new Paper( "<p>There is no <code>keyword</code> in this sentence.</p>" ),
		keyphraseForms: [ [ "keyword", "keywords" ] ],
		expectedCount: 0,
		expectedMarkings: [],
		skip: false,
	},
	{
		description: "doesn't count keyphrase instances if they are a shortcode",
		paper: new Paper( "<p>There is no [keyword] in this sentence.</p>", { shortcodes: [ "keyword" ] } ),
		keyphraseForms: [ [ "keyword", "keywords" ] ],
		expectedCount: 0,
		expectedMarkings: [],
		skip: false,
	},
	{
		description: "only counts full-matches of the keyphrase: full-match means when all word of the keyphrase are found in the sentence",
		paper: new Paper( "<p>A string with three keys (key and another key) and one word.</p>" ),
		keyphraseForms: [ [ "key", "keys" ], [ "word", "words" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				marked: "A string with three <yoastmark class='yoast-text-mark'>keys</yoastmark> (<yoastmark class='yoast-text-mark'>" +
					"key</yoastmark> and another <yoastmark class='yoast-text-mark'>key</yoastmark>) and one <yoastmark " +
					"class='yoast-text-mark'>word</yoastmark>.",
				original: "A string with three keys (key and another key) and one word.",
				position: {
					startOffset: 23,
					endOffset: 27,
					startOffsetBlock: 20,
					endOffsetBlock: 24,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
			new Mark( {
				marked: "A string with three <yoastmark class='yoast-text-mark'>keys</yoastmark> (<yoastmark class='yoast-text-mark'>" +
					"key</yoastmark> and another <yoastmark class='yoast-text-mark'>key</yoastmark>) and one <yoastmark " +
					"class='yoast-text-mark'>word</yoastmark>.",
				original: "A string with three keys (key and another key) and one word.",
				position: {
					startOffset: 29,
					endOffset: 32,
					startOffsetBlock: 26,
					endOffsetBlock: 29,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
			new Mark( {
				marked: "A string with three <yoastmark class='yoast-text-mark'>keys</yoastmark> (<yoastmark class='yoast-text-mark'>" +
					"key</yoastmark> and another <yoastmark class='yoast-text-mark'>key</yoastmark>) and one <yoastmark " +
					"class='yoast-text-mark'>word</yoastmark>.",
				original: "A string with three keys (key and another key) and one word.",
				position: {
					startOffset: 45,
					endOffset: 48,
					startOffsetBlock: 42,
					endOffsetBlock: 45,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
			new Mark( {
				marked: "A string with three <yoastmark class='yoast-text-mark'>keys</yoastmark> (<yoastmark class='yoast-text-mark'>" +
					"key</yoastmark> and another <yoastmark class='yoast-text-mark'>key</yoastmark>) and one <yoastmark " +
					"class='yoast-text-mark'>word</yoastmark>.",
				original: "A string with three keys (key and another key) and one word.",
				position: {
					startOffset: 58,
					endOffset: 62,
					startOffsetBlock: 55,
					endOffsetBlock: 59,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
	{
		description: "matches both singular and reduplicated plural form of the keyphrase in Indonesian, " +
			"the plural should be counted as one occurrence",
		paper: new Paper( "<p>Lorem ipsum dolor sit amet, consectetur keyword-keyword, keyword adipiscing elit.</p>",
			{ locale: "id_ID", keyword: "keyword" } ),
		keyphraseForms: [ [ "keyword", "keyword-keyword" ] ],
		expectedCount: 2,
		expectedMarkings: [
			new Mark( {
				marked: "Lorem ipsum dolor sit amet, consectetur <yoastmark class='yoast-text-mark'>keyword-keyword</yoastmark>," +
					" <yoastmark class='yoast-text-mark'>keyword</yoastmark> adipiscing elit.",
				original: "Lorem ipsum dolor sit amet, consectetur keyword-keyword, keyword adipiscing elit.",
				position: {
					endOffset: 58,
					startOffset: 43,
					startOffsetBlock: 40,
					endOffsetBlock: 55,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
			new Mark( {
				marked: "Lorem ipsum dolor sit amet, consectetur <yoastmark class='yoast-text-mark'>keyword-keyword</yoastmark>," +
					" <yoastmark class='yoast-text-mark'>keyword</yoastmark> adipiscing elit.",
				original: "Lorem ipsum dolor sit amet, consectetur keyword-keyword, keyword adipiscing elit.",
				position: {
					startOffset: 60,
					endOffset: 67,
					startOffsetBlock: 57,
					endOffsetBlock: 64,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
	{
		description: "matches both reduplicated keyphrase separated by '-' as two occurrence in English",
		paper: new Paper( "<p>Lorem ipsum dolor sit amet, consectetur keyword-keyword, adipiscing elit.</p>",
			{ locale: "en_US", keyword: "keyword" } ),
		keyphraseForms: [ [ "keyword", "keyword-keyword" ] ],
		expectedCount: 2,
		expectedMarkings: [
			new Mark( {
				marked: "Lorem ipsum dolor sit amet, consectetur <yoastmark class='yoast-text-mark'>keyword-keyword</yoastmark>, adipiscing elit.",
				original: "Lorem ipsum dolor sit amet, consectetur keyword-keyword, adipiscing elit.",
				position: {
					endOffset: 58,
					startOffset: 43,
					startOffsetBlock: 40,
					endOffsetBlock: 55,
					attributeId: "",
					clientId: "",
					isFirstSection: false } } ),
		 ],
		skip: false,
	},
	{
		description: "counts one occurrence of reduplicated keyphrase separated by '-' as two occurrence in English " +
			"when the keyphrase is enclosed in double quotes",
		paper: new Paper( "<p>Lorem ipsum dolor sit amet, consectetur kupu-kupu, adipiscing elit.</p>",
			{ locale: "en_US", keyword: "\"kupu-kupu\"" } ),
		keyphraseForms: [ [ "kupu-kupu" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				marked: "Lorem ipsum dolor sit amet, consectetur <yoastmark class='yoast-text-mark'>kupu-kupu</yoastmark>, adipiscing elit.",
				original: "Lorem ipsum dolor sit amet, consectetur kupu-kupu, adipiscing elit.",
				position: {
					endOffset: 52,
					startOffset: 43,
					startOffsetBlock: 40,
					endOffsetBlock: 49,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
		],
		skip: false,
	},
	{
		description: "counts a single word keyphrase with exact matching",
		paper: new Paper( "<p>A string with a keyword.</p>", { keyword: "\"keyword\"" } ),
		keyphraseForms: [ [ "keyword" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( { marked: "A string with a <yoastmark class='yoast-text-mark'>keyword</yoastmark>.",
				original: "A string with a keyword.",
				position: {
					startOffset: 19,
					endOffset: 26,
					startOffsetBlock: 16,
					endOffsetBlock: 23,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
	{
		description: "with exact matching, a singular single word keyphrase should not be counted if the focus keyphrase is plural",
		paper: new Paper( "<p>A string with a keyword.</p>", { keyword: "\"keywords\"" } ),
		keyphraseForms: [ [ "keywords" ] ],
		expectedCount: 0,
		expectedMarkings: [],
		skip: false,
	},
	{
		description: "with exact matching, a multi word keyphrase should be counted if the focus keyphrase is the same",
		paper: new Paper( "<p>A string with a key phrase key phrase.</p>", { keyword: "\"key phrase\"" } ),
		keyphraseForms: [ [ "key phrase" ] ],
		expectedCount: 2,
		expectedMarkings: [ new Mark( { marked: "A string with a <yoastmark class='yoast-text-mark'>key phrase key phrase</yoastmark>.",
			original: "A string with a key phrase key phrase.",
			position: {
				endOffset: 40,
				startOffset: 19,
				startOffsetBlock: 16,
				endOffsetBlock: 37,
				attributeId: "",
				clientId: "",
				isFirstSection: false,
			} } ) ],
		skip: false,
	},
	{
		description: "with exact matching, a multi word keyphrase should be counted if the focus keyphrase is the same",
		paper: new Paper( "<p>A string with a key phrase.</p>", { keyword: "\"key phrase\"" } ),
		keyphraseForms: [ [ "key phrase" ] ],
		expectedCount: 1,
		expectedMarkings: [ new Mark( { marked: "A string with a <yoastmark class='yoast-text-mark'>key phrase</yoastmark>.",
			original: "A string with a key phrase.",
			position: {
				startOffset: 19,
				endOffset: 29,
				startOffsetBlock: 16,
				endOffsetBlock: 26,
				attributeId: "",
				clientId: "",
				isFirstSection: false,
			},
		} ) ],
		skip: false,
	},
	{
		description: "with exact matching, a multi word keyphrase should not be counted if " +
			"the focus keyphrase has the same words in a different order",
		paper: new Paper( "<p>A string with a phrase key.</p>", { keyword: "\"key phrase\"" } ),
		keyphraseForms: [ [ "key phrase" ] ],
		expectedCount: 0,
		expectedMarkings: [],
		skip: false,
	},
	{
		description: "with exact matching, it should match a full stop if it is part of the keyphrase and directly precedes the keyphrase.",
		paper: new Paper( "<p>A .sentence with a keyphrase.</p>", { keyword: "\".sentence\"" } ),
		keyphraseForms: [ [ ".sentence" ] ],
		expectedCount: 1,
		expectedMarkings: [ new Mark( { marked: "A <yoastmark class='yoast-text-mark'>.sentence</yoastmark> with a keyphrase.",
			original: "A .sentence with a keyphrase.",
			position: {
				startOffset: 5,
				endOffset: 14,
				startOffsetBlock: 2,
				endOffsetBlock: 11,
				attributeId: "",
				clientId: "",
				isFirstSection: false,
			},
		} ) ],
		skip: false,
	},
	{
		description: "with exact matching, the keyphrase directly preceded by a full stop should not match a " +
			"keyphrase occurrence without the full stop in the text.",
		paper: new Paper( "<p>A sentence with a keyphrase.</p>", { keyword: "\".sentence\"" } ),
		keyphraseForms: [ [ ".sentence" ] ],
		expectedCount: 0,
		expectedMarkings: [],
		skip: false,
	},
	{
		description: "can match dollar sign as in '$keyword' with exact matching.",
		paper: new Paper( "<p>A string with a $keyword.</p>", { keyword: "\"$keyword\"" } ),
		keyphraseForms: [ [ "\\$keyword" ] ],
		expectedCount: 1,
		expectedMarkings: [ new Mark( { marked: "A string with a <yoastmark class='yoast-text-mark'>$keyword</yoastmark>.",
			original: "A string with a $keyword.",
			position: {
				endOffset: 27,
				startOffset: 19,
				startOffsetBlock: 16,
				endOffsetBlock: 24,
				attributeId: "",
				clientId: "",
				isFirstSection: false,
			} } ) ],
		skip: false,
	},
	{
		description: "can match multiple occurrences of keyphrase in the text with exact matching.",
		paper: new Paper( "<p>A string with cats and dogs, and other cats and dogs.</p>", { keyword: "\"cats and dogs\"" } ),
		keyphraseForms: [ [ "cats and dogs" ] ],
		expectedCount: 2,
		expectedMarkings: [
			new Mark( { marked: "A string with <yoastmark class='yoast-text-mark'>cats and dogs</yoastmark>, " +
				"and other <yoastmark class='yoast-text-mark'>cats and dogs</yoastmark>.",
			original: "A string with cats and dogs, and other cats and dogs.",
			position: {
				endOffset: 30,
				startOffset: 17,
				startOffsetBlock: 14,
				endOffsetBlock: 27,
				attributeId: "",
				clientId: "",
				isFirstSection: false,
			} } ),
			new Mark( { marked: "A string with <yoastmark class='yoast-text-mark'>cats and dogs</yoastmark>, " +
					"and other <yoastmark class='yoast-text-mark'>cats and dogs</yoastmark>.",
			original: "A string with cats and dogs, and other cats and dogs.",
			position: {
				endOffset: 55,
				startOffset: 42,
				startOffsetBlock: 39,
				endOffsetBlock: 52,
				attributeId: "",
				clientId: "",
				isFirstSection: false,
			} } ) ],
		skip: false,
	},
	{
		description: "counts all occurrence in the sentence, even when they occur more than 2 time consecutively",
		paper: new Paper( "<p>this is a keyword keyword keyword.</p>", { keyword: "keyword", locale: "en_US" } ),
		keyphraseForms: [ [ "keyword", "keywords" ] ],
		expectedCount: 3,
		expectedMarkings: [
			new Mark( { marked: "this is a <yoastmark class='yoast-text-mark'>keyword keyword keyword</yoastmark>.",
				original: "this is a keyword keyword keyword.",
				position: {
					endOffset: 36,
					startOffset: 13,
					startOffsetBlock: 10,
					endOffsetBlock: 33,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ) ],
		skip: false,
	},
	{
		description: "counts all occurrence in the sentence, even when they occur more than 2 time consecutively: with exact matching",
		paper: new Paper( "<p>A sentence about a red panda red panda red panda.</p>", { keyword: "\"red panda\"", locale: "en_US" } ),
		keyphraseForms: [ [ "red panda" ] ],
		expectedCount: 3,
		expectedMarkings: [
			new Mark( { marked: "A sentence about a <yoastmark class='yoast-text-mark'>red panda red panda red panda</yoastmark>.",
				original: "A sentence about a red panda red panda red panda.",
				position: {
					endOffset: 51,
					startOffset: 22,
					startOffsetBlock: 19,
					endOffsetBlock: 48,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ) ],
		skip: false,
	},
];

describe.each( testCases )( "Test for counting the keyphrase in a text in english", function( {
	description,
	paper,
	keyphraseForms,
	expectedCount,
	expectedMarkings,
	skip } ) {
	const test = skip ? it.skip : it;

	test( description, function() {
		const mockResearcher = buildMorphologyMockResearcher( keyphraseForms );
		buildTree( paper, mockResearcher );
		const keyphraseCountResult = getKeyphraseCount( paper, mockResearcher );
		expect( keyphraseCountResult.count ).toBe( expectedCount );
		expect( keyphraseCountResult.markings ).toEqual( expectedMarkings );
	} );
} );

const testCasesWithSpecialCharacters = [
	{
		description: "counts the keyphrase occurrence in the text with &nbsp;",
		paper: new Paper( "<p>a string with nbsp to match the key&nbsp;word.</p>", { keyword: "key word" } ),
		keyphraseForms: [ [ "key" ], [ "word" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( { marked: "a string with nbsp to match the <yoastmark class='yoast-text-mark'>key word</yoastmark>.",
				original: "a string with nbsp to match the key word.",
				position: {
					startOffset: 35,
					endOffset: 43,
					startOffsetBlock: 32,
					endOffsetBlock: 40,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
	{
		description: "counts a string with a keyphrase occurrence with a '-' in it",
		paper: new Paper( "<p>A string with a key-word.</p>", { keyword: "key-word" } ),
		keyphraseForms: [ [ "key-word", "key-words" ] ],
		expectedCount: 1,
		expectedMarkings: [ new Mark( { marked: "A string with a <yoastmark class='yoast-text-mark'>key-word</yoastmark>.",
			original: "A string with a key-word.",
			position: {
				endOffset: 27,
				startOffset: 19,
				startOffsetBlock: 16,
				endOffsetBlock: 24,
				attributeId: "",
				clientId: "",
				isFirstSection: false,
			} } ) ],
		skip: false,
	},
	{
		description: "counts occurrence with dash only when the keyphrase contains dash",
		paper: new Paper( "<p>A string with a key-phrase and key phrase.</p>", { keyword: "key-phrase" } ),
		keyphraseForms: [ [ "key-phrase", "key-phrases" ] ],
		expectedCount: 1,
		expectedMarkings: [ new Mark( { marked: "A string with a <yoastmark class='yoast-text-mark'>key-phrase</yoastmark> and key phrase.",
			original: "A string with a key-phrase and key phrase.",
			position: {
				endOffset: 29,
				startOffset: 19,
				startOffsetBlock: 16,
				endOffsetBlock: 26,
				attributeId: "",
				clientId: "",
				isFirstSection: false,
			} } ) ],
		skip: false,
	},
	{
		description: "should be no match when the sentence contains the keyphrase with a dash but in the wrong order",
		paper: new Paper( "<p>A string with a panda-red.</p>", { keyword: "red-panda" } ),
		keyphraseForms: [ [ "red-panda" ] ],
		expectedCount: 0,
		expectedMarkings: [],
		skip: false,
	},
	{
		description: "should find a match when the sentence contains the keyphrase with a dash but in the wrong order " +
			"and the keyphrase doesn't contain a dash",
		paper: new Paper( "<p>A string with a panda-red.</p>", { keyword: "red panda" } ),
		keyphraseForms: [ [ "red" ], [ "panda" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				original: "A string with a panda-red.",
				marked: "A string with a <yoastmark class='yoast-text-mark'>panda-red</yoastmark>.",
				position: {
					startOffset: 19,
					endOffset: 28,
					startOffsetBlock: 16,
					endOffsetBlock: 25,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
	{
		description: "should find a match when the sentence contains the keyphrase with a dash with the same order " +
			"and the keyphrase doesn't contain a dash",
		paper: new Paper( "<p>A string with a key-word.</p>", { keyword: "key word" } ),
		keyphraseForms: [ [ "key", "keys" ], [ "word", "words" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				original: "A string with a key-word.",
				marked: "A string with a <yoastmark class='yoast-text-mark'>key-word</yoastmark>.",
				position: {
					endOffset: 27,
					startOffset: 19,
					startOffsetBlock: 16,
					endOffsetBlock: 24,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
	{
		description: "should find a match when the word of the keyphrase occurs in the sentence hyphenated with a non-keyphrase word." +
		"For example 'key' in 'key-phrase'.",
		paper: new Paper( "<p>A string with a word of key-phrase.</p>", { keyword: "key word" } ),
		keyphraseForms: [ [ "key", "keys" ], [ "word", "words" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				original: "A string with a word of key-phrase.",
				marked: "A string with a <yoastmark class='yoast-text-mark'>word</yoastmark> of" +
					" <yoastmark class='yoast-text-mark'>key-phrase</yoastmark>.",
				position: {
					endOffset: 23,
					startOffset: 19,
					startOffsetBlock: 16,
					endOffsetBlock: 20,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
			new Mark( {
				original: "A string with a word of key-phrase.",
				marked: "A string with a <yoastmark class='yoast-text-mark'>word</yoastmark> of" +
					" <yoastmark class='yoast-text-mark'>key-phrase</yoastmark>.",
				position: {
					endOffset: 37,
					startOffset: 27,
					startOffsetBlock: 24,
					endOffsetBlock: 34,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
			// Note that in this case, we'll highlight 'key-phrase' even though technically we only match "key" in "key-phrase".
			// This is the consequence of tokenizing "key-phrase" into one token instead of three.
		],
		skip: false,
	},
	{
		description: "should find a match between a keyphrase with an underscore and its occurrence in the text with the same form",
		paper: new Paper( "<p>A string with a key_word.</p>", { keyword: "key_word" } ),
		keyphraseForms: [ [ "key_word", "key_words" ] ],
		expectedCount: 1,
		expectedMarkings: [ new Mark( { marked: "A string with a <yoastmark class='yoast-text-mark'>key_word</yoastmark>.",
			original: "A string with a key_word.",
			position: { endOffset: 27, startOffset: 19,
				startOffsetBlock: 16,
				endOffsetBlock: 24,
				attributeId: "",
				clientId: "",
				isFirstSection: false,
			} } ) ],
		skip: false,
	},
	{
		description: "should find a match between a keyphrase with an ampersand (&) and its occurrence in the text with the same form",
		paper: new Paper( "<p>A string with key&word in it</p>", { keyword: "key&word" } ),
		keyphraseForms: [ [ "key&word" ] ],
		expectedCount: 1,
		expectedMarkings: [ new Mark( { marked: "A string with <yoastmark class='yoast-text-mark'>key&word</yoastmark> in it",
			original: "A string with key&word in it",
			position: { endOffset: 25, startOffset: 17,
				startOffsetBlock: 14,
				endOffsetBlock: 22,
				attributeId: "",
				clientId: "",
				isFirstSection: false,
			} } ) ],
		skip: false,
	},
	{
		description: "should still match keyphrase occurrence with different types of apostrophe.",
		paper: new Paper( "<p>A string with quotes to match the key'word, even if the quotes differ.</p>", { keyword: "key‛word" } ),
		keyphraseForms: [ [ "key‛word", "key‛words" ] ],
		expectedCount: 1,
		expectedMarkings: [ new Mark( {
			marked: "A string with quotes to match the <yoastmark class='yoast-text-mark'>key'word</yoastmark>, even if the quotes differ.",
			original: "A string with quotes to match the key'word, even if the quotes differ.",
			position: { endOffset: 45, startOffset: 37,
				startOffsetBlock: 34,
				endOffsetBlock: 42,
				attributeId: "",
				clientId: "",
				isFirstSection: false,
			} } ) ],
		skip: false,
	},
	{
		description: "can match dollar sign as in '$keyword'.",
		paper: new Paper( "<p>A string with a $keyword.</p>", { keyword: "$keyword" } ),
		keyphraseForms: [ [ "\\$keyword" ] ],
		expectedCount: 1,
		expectedMarkings: [ new Mark( { marked: "A string with a <yoastmark class='yoast-text-mark'>$keyword</yoastmark>.",
			original: "A string with a $keyword.",
			position: {
				startOffset: 19,
				endOffset: 27,
				startOffsetBlock: 16,
				endOffsetBlock: 24,
				attributeId: "",
				clientId: "",
				isFirstSection: false,
			},
		} ) ],
		skip: false,
	},
	{
		description: "can match 2 occurrences of a keyphrase ending in an HTML entity (&copy; standing for ©) and output correct Marks",
		paper: new Paper( "<p>A string keyphrase&copy; with a keyphrase&copy;.</p>", { keyword: "keyphrase©" } ),
		keyphraseForms: [ [ "keyphrase©" ] ],
		expectedCount: 2,
		expectedMarkings: [ new Mark( {
			marked: "A string <yoastmark class='yoast-text-mark'>keyphrase©</yoastmark> with a " +
				"<yoastmark class='yoast-text-mark'>keyphrase©</yoastmark>.",
			original: "A string keyphrase© with a keyphrase©.",
			position: { endOffset: 27, startOffset: 12,
				startOffsetBlock: 9,
				endOffsetBlock: 24,
				attributeId: "",
				clientId: "",
				isFirstSection: false,
			} } ),
		new Mark( {
			marked: "A string <yoastmark class='yoast-text-mark'>keyphrase©</yoastmark> with a " +
				"<yoastmark class='yoast-text-mark'>keyphrase©</yoastmark>.",
			original: "A string keyphrase© with a keyphrase©.",
			position: { endOffset: 50, startOffset: 35,
				startOffsetBlock: 32,
				endOffsetBlock: 47,
				attributeId: "",
				clientId: "",
				isFirstSection: false,
			} } ) ],
		skip: false,
	},
	{
		description: "can match an occurrence of a keyphrase after HTML entities, and output correct Marks",
		paper: new Paper( "<p>I find a&amp;b to be &gt; c&amp;d for dog food.</p>", { keyword: "dog" } ),
		keyphraseForms: [ [ "dog" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				marked: "I find a&b to be > c&d for <yoastmark class='yoast-text-mark'>dog</yoastmark> food.",
				original: "I find a&b to be > c&d for dog food.",
				position: {
					startOffsetBlock: 38,
					endOffsetBlock: 41,
					startOffset: 41,
					endOffset: 44,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ) ],
		skip: false,
	},
	{
		description: "can match an occurrence of a keyphrase containing an & in the middle, as in 'a&b', and output correct Marks",
		paper: new Paper( "<p>At a&amp;b they have the best stuff.</p>", { keyword: "a&b" } ),
		keyphraseForms: [ [ "a&b" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				marked: "At <yoastmark class='yoast-text-mark'>a&b</yoastmark> they have the best stuff.",
				original: "At a&b they have the best stuff.",
				position: {
					startOffsetBlock: 3,
					endOffsetBlock: 10,
					startOffset: 6,
					endOffset: 13,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ) ],
		skip: false,
	},
	{
		description: "doesn't match unhyphenated occurrences in the text if the keyphrase is hyphenated.",
		paper: new Paper( "<p>A string with a key word.</p>", { keyword: "key-word" } ),
		keyphraseForms: [ [ "key-word", "key-words" ] ],
		expectedCount: 0,
		expectedMarkings: [],
		skip: false,
	},
	{
		description: "can match keyphrase enclosed in «» in the text, also if the paper's keyphrase is not enclosed in «»",
		paper: new Paper( "<p>A string with a «keyword».</p>", { keyword: "keyword" } ),
		keyphraseForms: [ [ "keyword" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				original: "A string with a «keyword».",
				marked: "A string with a «<yoastmark class='yoast-text-mark'>keyword</yoastmark>».",
				position: { endOffset: 27, startOffset: 20,
					startOffsetBlock: 17,
					endOffsetBlock: 24,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} }
			),
		],
		skip: false,
	},
	{
		description: "can match an occurrence of the keyphrase not enclosed in «» when the paper's keyphrase is enclosed in «»",
		paper: new Paper( "<p>A string with a keyword.</p>", { keyword: "«keyword»" } ),
		keyphraseForms: [ [ "keyword" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				original: "A string with a keyword.",
				marked: "A string with a <yoastmark class='yoast-text-mark'>keyword</yoastmark>.",
				position: { endOffset: 26, startOffset: 19,
					startOffsetBlock: 16,
					endOffsetBlock: 23,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} }
			),
		],
		skip: false,
	},
	{
		description: "can match keyphrase enclosed in ‹› in the text, also if the paper's keyphrase is not enclosed in ‹›",
		paper: new Paper( "<p>A string with a ‹keyword›.</p>", { keyword: "keyword" } ),
		keyphraseForms: [ [ "keyword" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				original: "A string with a ‹keyword›.",
				marked: "A string with a '<yoastmark class='yoast-text-mark'>keyword</yoastmark>'.",
				position: { endOffset: 27, startOffset: 20,
					startOffsetBlock: 17,
					endOffsetBlock: 24,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} }
			),
		],
		skip: false,
	},
	{
		description: "can match an occurrence of the keyphrase not enclosed in ‹› when the paper's keyphrase is enclosed in ‹›",
		paper: new Paper( "<p>A string with a keyword.</p>", { keyword: "‹keyword›" } ),
		keyphraseForms: [ [ "keyword" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				original: "A string with a keyword.",
				marked: "A string with a <yoastmark class='yoast-text-mark'>keyword</yoastmark>.",
				position: { endOffset: 26, startOffset: 19,
					startOffsetBlock: 16,
					endOffsetBlock: 23,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} }
			),
		],
		skip: false,
	},
	{
		description: "can match keyphrase preceded by ¿",
		paper: new Paper( "<p>¿Keyword is it</p>", { keyword: "keyword" } ),
		keyphraseForms: [ [ "keyword" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				original: "¿Keyword is it",
				marked: "¿<yoastmark class='yoast-text-mark'>Keyword</yoastmark> is it",
				position: { endOffset: 11, startOffset: 4,
					startOffsetBlock: 1,
					endOffsetBlock: 8,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} }
			),
		],
		skip: false,
	},
	{
		description: "can match keyphrase followed by RTL-specific punctuation marks",
		paper: new Paper( "<p>الجيدة؟</p>", { keyword: "الجيدة" } ),
		keyphraseForms: [ [ "الجيدة" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				original: "الجيدة؟",
				marked: "<yoastmark class='yoast-text-mark'>الجيدة</yoastmark>؟",
				position: { endOffset: 9, startOffset: 3,
					startOffsetBlock: 0,
					endOffsetBlock: 6,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} }
			),
		],
		skip: false,
	},
	{
		description: "can match paragraph gutenberg block",
		paper: new Paper(
			`<!-- wp:paragraph -->
				<p>a string of text with the keyword in it</p>
			<!-- /wp:paragraph -->`,
			{
				keyword: "keyword",
				wpBlocks: [
					{
						attributes: {
							content: "a string of text with the keyword in it",
						},
						name: "core/paragraph",
						clientId: "5615ca1f-4052-41a9-97be-be19cfd2085b",
						innerBlocks: [],
					},
				],
			}
		),
		keyphraseForms: [ [ "keyword", "keywords" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				marked: "a string of text with the <yoastmark class='yoast-text-mark'>keyword</yoastmark> in it",
				original: "a string of text with the keyword in it",
				position: {
					startOffset: 55,
					endOffset: 62,
					startOffsetBlock: 26,
					endOffsetBlock: 33,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
	{
		description: "can match complex paragraph gutenberg block",
		paper: new Paper(
			`<!-- wp:paragraph -->
				<p><strong>Over the years, we’ve written&nbsp;quite a few articles about&nbsp;</strong>
				<a href="https://yoast.com/tag/branding/">branding</a><strong>.
				Branding is about getting people to relate to your company and
				products. It’s also about trying to make your brand synonymous with a certain product or service.
				This can be a lengthy and hard project. It can potentially cost you all of your revenue.
				It’s no wonder that branding is often associated with investing lots of money in marketing and promotion.
				However, for a lot of small business owners, the investment in branding will have
				to&nbsp;be made with a&nbsp;relatively small budget.&nbsp;</strong></p>
			<!-- /wp:paragraph -->`,
			{
				keyword: "keyword",
				wpBlocks: [
					{
						attributes: {
							// eslint-disable-next-line max-len
							content: "<strong>Over the years, we’ve written&nbsp;quite a few articles about&nbsp;</strong><a href=\"https://yoast.com/tag/branding/\">branding</a><strong>. Branding is about getting people to relate to your company and products. It’s also about trying to make your brand synonymous with a certain product or service. This can be a lengthy and hard project. It can potentially cost you all of your revenue. It’s no wonder that branding is often associated with investing lots of money in marketing and promotion. However, for a lot of small business owners, the investment in branding will have to&nbsp;be made with a&nbsp;relatively small budget.&nbsp;</strong>",
						},
						name: "core/paragraph",
						clientId: "6860403c-0b36-43b2-96fa-2d30c10cb44c",
						innerBlocks: [],
					},
				],
			}
		),
		keyphraseForms: [ [ "synonymous" ] ],
		expectedCount: 1,
		expectedMarkings: [

			new Mark( {
				// eslint-disable-next-line max-len
				marked: " It's also about trying to make your brand <yoastmark class='yoast-text-mark'>synonymous</yoastmark> with a certain product or service.",
				original: " It’s also about trying to make your brand synonymous with a certain product or service.",
				position: {
					startOffset: 295,
					endOffset: 305,
					startOffsetBlock: 266,
					endOffsetBlock: 276,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
	{
		description: "can match complex paragraph gutenberg block",
		paper: new Paper(
			`<!-- wp:paragraph -->
				<p>You might be a local bakery with 10 employees, or a local industrial company employing up to 500 people.
				These all can be qualified as
				‘small business’. All have the same main goal when they start: the need to establish a name in their field of expertise. There
				are multiple ways to do this, without a huge budget.
				In this post, I’ll share my thoughts on how to go about your own low-budget branding.</p>
			<!-- /wp:paragraph -->`,
			{
				keyword: "expertise",
				wpBlocks: [
					{
						attributes: {
							// eslint-disable-next-line max-len
							content: "You might be a local bakery with 10 employees, or a local industrial company employing up to 500 people. These all can be qualified as ‘small business’. All have the same main goal when they start: the need to establish a name in their field of expertise. There are multiple ways to do this, without a huge budget. In this post, I’ll share my thoughts on how to go about your own low-budget branding.",
						},
						name: "core/paragraph",
						clientId: "65be5146-3395-4845-8c7c-4a79fd6e3611",
						innerBlocks: [],
					},
				],
			}
		),
		keyphraseForms: [ [ "expertise" ] ],
		expectedCount: 1,
		expectedMarkings: [

			new Mark( {
				// eslint-disable-next-line max-len
				marked: " All have the same main goal when they start: the need to establish a name in their field of <yoastmark class='yoast-text-mark'>expertise</yoastmark>.",
				original: " All have the same main goal when they start: the need to establish a name in their field of expertise.",
				position: {
					startOffset: 282,
					endOffset: 291,
					startOffsetBlock: 253,
					endOffsetBlock: 262,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
	{
		description: "can match heading gutenberg block",
		paper: new Paper(
			`<!-- wp:heading -->
				<h2 class="wp-block-heading" id="h-define-and-communicate-brand-values">Define and communicate brand values</h2>
			<!-- /wp:heading -->`,
			{
				keyword: "communicate",
				wpBlocks: [
					{
						attributes: {
							level: 2,
							content: "Define and communicate brand values",
						},
						name: "core/heading",
						clientId: "b8e62d35-b3af-45ec-9889-139ef0a9baaa",
						innerBlocks: [],
					},
				],
			}
		),
		keyphraseForms: [ [ "communicate" ] ],
		expectedCount: 1,
		expectedMarkings: [
			// eslint-disable-next-line max-len
			new Mark( {
				marked: "Define and <yoastmark class='yoast-text-mark'>communicate</yoastmark> brand values",
				original: "Define and communicate brand values",
				position: {
					startOffset: 107,
					endOffset: 118,
					startOffsetBlock: 11,
					endOffsetBlock: 22,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
	{
		description: "can match complex paragraph gutenberg block",
		paper: new Paper(
			`<!-- wp:columns -->
				<div class="wp-block-columns"><!-- wp:column -->
				<div class="wp-block-column"><!-- wp:paragraph -->
				<p><strong>Lorem Ipsum</strong>&nbsp;is simply dummy text of the printing and typesetting industry.</p>
				<!-- /wp:paragraph --></div>
				<!-- /wp:column -->

				<!-- wp:column -->
				<div class="wp-block-column"><!-- wp:paragraph -->
				<p>There are many variations of passages of Lorem Ipsum available</p>
				<!-- /wp:paragraph --></div>
				<!-- /wp:column --></div>
			 <!-- /wp:columns -->`,
			{
				keyword: "Ipsum",
				wpBlocks: [
					{
						attributes: {},
						name: "core/columns",
						clientId: "1b9f1d49-813e-4578-a19a-bf236447cc41",
						innerBlocks: [
							{
								attributes: {},
								name: "core/column",
								clientId: "09b93261-25ef-4391-98cc-630e8fa1eac1",
								innerBlocks: [
									{
										attributes: {
											// eslint-disable-next-line max-len
											content: "<strong>Lorem Ipsum</strong>&nbsp;is simply dummy text of the printing and typesetting industry.",
										},
										name: "core/paragraph",
										clientId: "3f0e68c1-287e-40ef-90c8-54b3ab61702a",
										innerBlocks: [],
									},
								],
							},
							{
								attributes: {},
								name: "core/column",
								clientId: "0f247feb-5ada-433d-bc97-1faa0265f7c4",
								innerBlocks: [
									{
										attributes: {
											content: "There are many variations of passages of Lorem Ipsum available",
										},
										name: "core/paragraph",
										clientId: "5093342c-ec93-48a2-b2d5-883ae514b12d",
										innerBlocks: [],
									},
								],
							},
						],
					},
				],
			}
		),
		keyphraseForms: [ [ "Ipsum" ] ],
		expectedCount: 2,
		expectedMarkings: [
			new Mark( {
				marked: "Lorem <yoastmark class='yoast-text-mark'>Ipsum</yoastmark> is simply dummy text of the printing and typesetting industry.",
				original: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
				position: {
					startOffset: 149,
					endOffset: 154,
					startOffsetBlock: 14,
					endOffsetBlock: 19,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
			new Mark( {
				marked: "There are many variations of passages of Lorem <yoastmark class='yoast-text-mark'>Ipsum</yoastmark> available",
				original: "There are many variations of passages of Lorem Ipsum available",
				position: {
					startOffset: 426,
					endOffset: 431,
					startOffsetBlock: 47,
					endOffsetBlock: 52,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
];

describe.each( testCasesWithSpecialCharacters )( "Test for counting the keyphrase in a text containing special characters",
	function( {
		description,
		paper,
		keyphraseForms,
		expectedCount,
		expectedMarkings,
		skip } ) {
		const test = skip ? it.skip : it;

		test( description, function() {
			const mockResearcher = buildMorphologyMockResearcher( keyphraseForms );
			buildTree( paper, mockResearcher );
			const keyphraseCountResult = getKeyphraseCount( paper, mockResearcher );
			expect( keyphraseCountResult.count ).toBe( expectedCount );
			expect( keyphraseCountResult.markings ).toEqual( expectedMarkings );
		} );
	} );

/**
 * The following test cases illustrates the current approach of matching transliterated keyphrase with non-transliterated version.
 * For example, word form "acción" from the keyphrase will match word "accion" in the sentence.
 * But, word form "accion" from the keyphrase will NOT match word "acción" in the sentence.
 *
 * This behaviour might change in the future.
 */
const testCasesWithLocaleMapping = [
	{
		description: "counts a string of text with German diacritics and eszett as the keyphrase",
		paper: new Paper( "<p>Waltz keepin auf mitz auf keepin äöüß weiner blitz deutsch spitzen.</p>", { keyword: "äöüß", locale: "de_DE" } ),
		keyphraseForms: [ [ "äöüß" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( { marked: "Waltz keepin auf mitz auf keepin <yoastmark class='yoast-text-mark'>äöüß</yoastmark> weiner blitz deutsch spitzen.",
				original: "Waltz keepin auf mitz auf keepin äöüß weiner blitz deutsch spitzen.",
				position: { endOffset: 40, startOffset: 36,
					startOffsetBlock: 33,
					endOffsetBlock: 37,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ) ],
		skip: false,
	},
	{
		description: "doesn't count a match if the keyphrase is with diacritic while the occurrence in the text is with diacritic",
		paper: new Paper( "<p>Acción Española fue una revista.</p>", { keyword: "accion", locale: "es_ES" } ),
		keyphraseForms: [ [ "accion" ] ],
		expectedCount: 0,
		expectedMarkings: [],
		skip: false,
	},
	{
		description: "counts a string of text with Spanish accented vowel",
		paper: new Paper( "<p>Accion Española fue una revista.</p>", { keyword: "acción", locale: "es_ES" } ),
		keyphraseForms: [ [ "acción" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( { marked: "<yoastmark class='yoast-text-mark'>Accion</yoastmark> Española fue una revista.",
				original: "Accion Española fue una revista.",
				position: { endOffset: 9, startOffset: 3,
					startOffsetBlock: 0,
					endOffsetBlock: 6,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ) ],
		skip: false,
	},
	{
		description: "counts a string of text with Swedish diacritics",
		paper: new Paper( "<p>oeverlaatelsebesiktning and overlatelsebesiktning</p>", { keyword: "överlåtelsebesiktning", locale: "sv_SV" } ),
		keyphraseForms: [ [ "överlåtelsebesiktning" ] ],
		expectedCount: 2,
		expectedMarkings: [
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>oeverlaatelsebesiktning</yoastmark> " +
					"and <yoastmark class='yoast-text-mark'>overlatelsebesiktning</yoastmark>",
				original: "oeverlaatelsebesiktning and overlatelsebesiktning",
				position: { endOffset: 26, startOffset: 3,
					startOffsetBlock: 0,
					endOffsetBlock: 23,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>oeverlaatelsebesiktning</yoastmark> " +
					"and <yoastmark class='yoast-text-mark'>overlatelsebesiktning</yoastmark>",
				original: "oeverlaatelsebesiktning and overlatelsebesiktning",
				position: { endOffset: 52, startOffset: 31,
					startOffsetBlock: 28,
					endOffsetBlock: 49,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ) ],
		skip: false,
	},
	{
		description: "counts a string of text with Norwegian diacritics",
		paper: new Paper( "<p>København and Koebenhavn and Kobenhavn</p>", { keyword: "København", locale: "nb_NO" } ),
		keyphraseForms: [ [ "København" ] ],
		expectedCount: 3,
		expectedMarkings: [
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>København</yoastmark> and <yoastmark class='yoast-text-mark'>" +
					"Koebenhavn</yoastmark> and <yoastmark class='yoast-text-mark'>Kobenhavn</yoastmark>",
				original: "København and Koebenhavn and Kobenhavn",
				position: { endOffset: 12, startOffset: 3,
					startOffsetBlock: 0,
					endOffsetBlock: 9,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>København</yoastmark> and <yoastmark class='yoast-text-mark'>" +
					"Koebenhavn</yoastmark> and <yoastmark class='yoast-text-mark'>Kobenhavn</yoastmark>",
				original: "København and Koebenhavn and Kobenhavn",
				position: { endOffset: 27, startOffset: 17,
					startOffsetBlock: 14,
					endOffsetBlock: 24,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>København</yoastmark> and <yoastmark class='yoast-text-mark'>" +
					"Koebenhavn</yoastmark> and <yoastmark class='yoast-text-mark'>Kobenhavn</yoastmark>",
				original: "København and Koebenhavn and Kobenhavn",
				position: { endOffset: 41, startOffset: 32,
					startOffsetBlock: 29,
					endOffsetBlock: 38,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ) ],
		skip: false,
	},
	{
		description: "counts a string with a Turkish diacritics",
		paper: new Paper( "<p>Türkçe and Turkce</p>", { keyword: "Türkçe", locale: "tr_TR" } ),
		keyphraseForms: [ [ "Türkçe" ] ],
		expectedCount: 2,
		expectedMarkings: [
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>Türkçe</yoastmark> and <yoastmark class='yoast-text-mark'>Turkce</yoastmark>",
				original: "Türkçe and Turkce",
				position: { endOffset: 9, startOffset: 3,
					startOffsetBlock: 0,
					endOffsetBlock: 6,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>Türkçe</yoastmark> and <yoastmark class='yoast-text-mark'>Turkce</yoastmark>",
				original: "Türkçe and Turkce",
				position: { endOffset: 20, startOffset: 14,
					startOffsetBlock: 11,
					endOffsetBlock: 17,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
		],
		skip: false,
	},
	{
		description: "still counts a string with a Turkish diacritics when exact matching is used",
		paper: new Paper( "<p>Türkçe and Turkce</p>", { keyword: "\"Türkçe\"", locale: "tr_TR" } ),
		keyphraseForms: [ [ "Türkçe" ] ],
		expectedCount: 2,
		expectedMarkings: [
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>Türkçe</yoastmark> and <yoastmark class='yoast-text-mark'>Turkce</yoastmark>",
				original: "Türkçe and Turkce",
				position: { endOffset: 9, startOffset: 3,
					startOffsetBlock: 0,
					endOffsetBlock: 6,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>Türkçe</yoastmark> and <yoastmark class='yoast-text-mark'>Turkce</yoastmark>",
				original: "Türkçe and Turkce",
				position: { endOffset: 20, startOffset: 14,
					startOffsetBlock: 11,
					endOffsetBlock: 17,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
		],
		skip: false,
	},
	{
		description: "counts a string with a different forms of Turkish i, kephrase: İstanbul",
		paper: new Paper( "<p>İstanbul and Istanbul and istanbul and ıstanbul</p>", { keyword: "İstanbul", locale: "tr_TR" } ),
		keyphraseForms: [ [ "İstanbul" ] ],
		expectedCount: 4,
		expectedMarkings: [
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>İstanbul</yoastmark> and <yoastmark class='yoast-text-mark'>Istanbul</yoastmark> and " +
					"<yoastmark class='yoast-text-mark'>istanbul</yoastmark> and <yoastmark class='yoast-text-mark'>ıstanbul</yoastmark>",
				original: "İstanbul and Istanbul and istanbul and ıstanbul",
				position: { endOffset: 11, startOffset: 3,
					startOffsetBlock: 0,
					endOffsetBlock: 8,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>İstanbul</yoastmark> and <yoastmark class='yoast-text-mark'>Istanbul</yoastmark> and " +
					"<yoastmark class='yoast-text-mark'>istanbul</yoastmark> and <yoastmark class='yoast-text-mark'>ıstanbul</yoastmark>",
				original: "İstanbul and Istanbul and istanbul and ıstanbul",
				position: { endOffset: 24, startOffset: 16,
					startOffsetBlock: 13,
					endOffsetBlock: 21,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>İstanbul</yoastmark> and <yoastmark class='yoast-text-mark'>Istanbul</yoastmark> and " +
					"<yoastmark class='yoast-text-mark'>istanbul</yoastmark> and <yoastmark class='yoast-text-mark'>ıstanbul</yoastmark>",
				original: "İstanbul and Istanbul and istanbul and ıstanbul",
				position: { endOffset: 37, startOffset: 29,
					startOffsetBlock: 26,
					endOffsetBlock: 34,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>İstanbul</yoastmark> and <yoastmark class='yoast-text-mark'>Istanbul</yoastmark> and " +
					"<yoastmark class='yoast-text-mark'>istanbul</yoastmark> and <yoastmark class='yoast-text-mark'>ıstanbul</yoastmark>",
				original: "İstanbul and Istanbul and istanbul and ıstanbul",
				position: { endOffset: 50, startOffset: 42,
					startOffsetBlock: 39,
					endOffsetBlock: 47,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ) ],
		skip: false,
	},
	{
		description: "counts a string with a different forms of Turkish i, kephrase: Istanbul",
		paper: new Paper( "<p>İstanbul and Istanbul and istanbul and ıstanbul</p>", { keyword: "Istanbul", locale: "tr_TR" } ),
		keyphraseForms: [ [ "Istanbul" ] ],
		expectedCount: 4,
		expectedMarkings: [
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>İstanbul</yoastmark> and <yoastmark class='yoast-text-mark'>Istanbul</yoastmark> and " +
					"<yoastmark class='yoast-text-mark'>istanbul</yoastmark> and <yoastmark class='yoast-text-mark'>ıstanbul</yoastmark>",
				original: "İstanbul and Istanbul and istanbul and ıstanbul",
				position: { endOffset: 11, startOffset: 3,
					startOffsetBlock: 0,
					endOffsetBlock: 8,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>İstanbul</yoastmark> and <yoastmark class='yoast-text-mark'>Istanbul</yoastmark> and " +
					"<yoastmark class='yoast-text-mark'>istanbul</yoastmark> and <yoastmark class='yoast-text-mark'>ıstanbul</yoastmark>",
				original: "İstanbul and Istanbul and istanbul and ıstanbul",
				position: { endOffset: 24, startOffset: 16,
					startOffsetBlock: 13,
					endOffsetBlock: 21,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>İstanbul</yoastmark> and <yoastmark class='yoast-text-mark'>Istanbul</yoastmark> and " +
					"<yoastmark class='yoast-text-mark'>istanbul</yoastmark> and <yoastmark class='yoast-text-mark'>ıstanbul</yoastmark>",
				original: "İstanbul and Istanbul and istanbul and ıstanbul",
				position: { endOffset: 37, startOffset: 29,
					startOffsetBlock: 26,
					endOffsetBlock: 34,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>İstanbul</yoastmark> and <yoastmark class='yoast-text-mark'>Istanbul</yoastmark> and " +
					"<yoastmark class='yoast-text-mark'>istanbul</yoastmark> and <yoastmark class='yoast-text-mark'>ıstanbul</yoastmark>",
				original: "İstanbul and Istanbul and istanbul and ıstanbul",
				position: { endOffset: 50, startOffset: 42,
					startOffsetBlock: 39,
					endOffsetBlock: 47,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ) ],
		skip: false,
	},
	{
		description: "counts a string with a different forms of Turkish i, kephrase: istanbul",
		paper: new Paper( "<p>İstanbul and Istanbul and istanbul and ıstanbul</p>", { keyword: "istanbul", locale: "tr_TR" } ),
		keyphraseForms: [ [ "istanbul" ] ],
		expectedCount: 4,
		expectedMarkings: [
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>İstanbul</yoastmark> and <yoastmark class='yoast-text-mark'>Istanbul</yoastmark> and " +
					"<yoastmark class='yoast-text-mark'>istanbul</yoastmark> and <yoastmark class='yoast-text-mark'>ıstanbul</yoastmark>",
				original: "İstanbul and Istanbul and istanbul and ıstanbul",
				position: { endOffset: 11, startOffset: 3,
					startOffsetBlock: 0,
					endOffsetBlock: 8,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>İstanbul</yoastmark> and <yoastmark class='yoast-text-mark'>Istanbul</yoastmark> and " +
					"<yoastmark class='yoast-text-mark'>istanbul</yoastmark> and <yoastmark class='yoast-text-mark'>ıstanbul</yoastmark>",
				original: "İstanbul and Istanbul and istanbul and ıstanbul",
				position: { endOffset: 24, startOffset: 16,
					startOffsetBlock: 13,
					endOffsetBlock: 21,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>İstanbul</yoastmark> and <yoastmark class='yoast-text-mark'>Istanbul</yoastmark> and " +
					"<yoastmark class='yoast-text-mark'>istanbul</yoastmark> and <yoastmark class='yoast-text-mark'>ıstanbul</yoastmark>",
				original: "İstanbul and Istanbul and istanbul and ıstanbul",
				position: { endOffset: 37, startOffset: 29,
					startOffsetBlock: 26,
					endOffsetBlock: 34,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>İstanbul</yoastmark> and <yoastmark class='yoast-text-mark'>Istanbul</yoastmark> and " +
					"<yoastmark class='yoast-text-mark'>istanbul</yoastmark> and <yoastmark class='yoast-text-mark'>ıstanbul</yoastmark>",
				original: "İstanbul and Istanbul and istanbul and ıstanbul",
				position: { endOffset: 50, startOffset: 42,
					startOffsetBlock: 39,
					endOffsetBlock: 47,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ) ],
		skip: false,
	},
	{
		description: "counts a string with a different forms of Turkish i, kephrase: ıstanbul",
		paper: new Paper( "<p>İstanbul and Istanbul and istanbul and ıstanbul</p>", { keyword: "ıstanbul", locale: "tr_TR" } ),
		keyphraseForms: [ [ "ıstanbul" ] ],
		expectedCount: 4,
		expectedMarkings: [
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>İstanbul</yoastmark> and <yoastmark class='yoast-text-mark'>Istanbul</yoastmark> and " +
					"<yoastmark class='yoast-text-mark'>istanbul</yoastmark> and <yoastmark class='yoast-text-mark'>ıstanbul</yoastmark>",
				original: "İstanbul and Istanbul and istanbul and ıstanbul",
				position: { endOffset: 11, startOffset: 3,
					startOffsetBlock: 0,
					endOffsetBlock: 8,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>İstanbul</yoastmark> and <yoastmark class='yoast-text-mark'>Istanbul</yoastmark> and " +
					"<yoastmark class='yoast-text-mark'>istanbul</yoastmark> and <yoastmark class='yoast-text-mark'>ıstanbul</yoastmark>",
				original: "İstanbul and Istanbul and istanbul and ıstanbul",
				position: { endOffset: 24, startOffset: 16,
					startOffsetBlock: 13,
					endOffsetBlock: 21,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>İstanbul</yoastmark> and <yoastmark class='yoast-text-mark'>Istanbul</yoastmark> and " +
					"<yoastmark class='yoast-text-mark'>istanbul</yoastmark> and <yoastmark class='yoast-text-mark'>ıstanbul</yoastmark>",
				original: "İstanbul and Istanbul and istanbul and ıstanbul",
				position: { endOffset: 37, startOffset: 29,
					startOffsetBlock: 26,
					endOffsetBlock: 34,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ),
			new Mark( {
				marked: "<yoastmark class='yoast-text-mark'>İstanbul</yoastmark> and <yoastmark class='yoast-text-mark'>Istanbul</yoastmark> and " +
					"<yoastmark class='yoast-text-mark'>istanbul</yoastmark> and <yoastmark class='yoast-text-mark'>ıstanbul</yoastmark>",
				original: "İstanbul and Istanbul and istanbul and ıstanbul",
				position: { endOffset: 50, startOffset: 42,
					startOffsetBlock: 39,
					endOffsetBlock: 47,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				} } ) ],
		skip: false,
	},
];

describe.each( testCasesWithLocaleMapping )( "Test for counting the keyphrase in a text with different locale mapping, e.g. Turkish",
	function( {
		description,
		paper,
		keyphraseForms,
		expectedCount,
		expectedMarkings,
		skip } ) {
		const test = skip ? it.skip : it;

		test( description, function() {
			const mockResearcher = buildMorphologyMockResearcher( keyphraseForms );
			buildTree( paper, mockResearcher );
			const keyphraseCountResult = getKeyphraseCount( paper, mockResearcher );
			expect( keyphraseCountResult.count ).toBe( expectedCount );
			expect( keyphraseCountResult.markings ).toEqual( expectedMarkings );
		} );
	} );

const testDataForHTMLTags = [
	{
		description: "counts keyphrase occurrence correctly in a text containing `<strong>` tag, and outputs correct Marks",
		paper: new Paper( "<p>The forepaws possess a \"false thumb\", which is an extension of a wrist bone, " +
			"the radial sesamoid found in many carnivorans. This thumb allows the animal to grip onto bamboo stalks " +
			"and both the digits and wrist bones are highly flexible. The red panda shares this feature " +
			"with the giant <strong>panda</strong>, which has a larger sesamoid that is more compressed at the sides." +
			" In addition, the red panda's sesamoid has a more sunken tip while the giant panda's curves in the middle.&nbsp;</p>",
		{ keyword: "giant panda", locale: "en_US" } ),
		keyphraseForms: [ [ "giant" ], [ "panda", "pandas" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				marked: " The red <yoastmark class='yoast-text-mark'>panda</yoastmark> shares this feature with the " +
					"<yoastmark class='yoast-text-mark'>giant panda</yoastmark>, which has a larger sesamoid that is more compressed at the sides.",
				original: " The red panda shares this feature with the giant panda, which has a larger sesamoid " +
					"that is more compressed at the sides.",
				position: {
					endOffset: 253,
					startOffset: 248,
					startOffsetBlock: 245,
					endOffsetBlock: 250,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
			new Mark( {
				marked: " The red <yoastmark class='yoast-text-mark'>panda</yoastmark> shares this feature with the " +
					"<yoastmark class='yoast-text-mark'>giant panda</yoastmark>, which has a larger sesamoid that is more compressed at the sides.",
				original: " The red panda shares this feature with the giant panda, which has a larger " +
					"sesamoid that is more compressed at the sides.",
				position: {
					endOffset: 288,
					startOffset: 283,
					startOffsetBlock: 280,
					endOffsetBlock: 285,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
			new Mark( {
				marked: " The red <yoastmark class='yoast-text-mark'>panda</yoastmark> shares this feature with the " +
					"<yoastmark class='yoast-text-mark'>giant panda</yoastmark>, which has a larger sesamoid that is more compressed at the sides.",
				original: " The red panda shares this feature with the giant panda, which has a larger " +
					"sesamoid that is more compressed at the sides.",
				position: {
					endOffset: 302,
					startOffset: 297,
					startOffsetBlock: 294,
					endOffsetBlock: 299,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
	{
		description: "counts keyphrase occurrence correctly in a text containing `<em>` tag and outputs correct Marks",
		paper: new Paper( "<p>The forepaws possess a \"false thumb\", which is an extension of a wrist bone, " +
			"the radial sesamoid found in many carnivorans. This thumb allows the animal to grip onto bamboo stalks " +
			"and both the digits and wrist bones are highly flexible. The red panda shares this feature " +
			"with the <em>giant panda</em>, which has a larger sesamoid that is more compressed at the sides." +
			" In addition, the red panda's sesamoid has a more sunken tip while the giant panda's curves in the middle.&nbsp;</p>",
		{ keyword: "giant panda", locale: "en_US" } ),
		keyphraseForms: [ [ "giant" ], [ "panda", "pandas" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				marked: " The red <yoastmark class='yoast-text-mark'>panda</yoastmark> shares this feature with the " +
					"<yoastmark class='yoast-text-mark'>giant panda</yoastmark>, which has a larger sesamoid that is more compressed at the sides.",
				original: " The red panda shares this feature with the giant panda, which has a larger sesamoid " +
					"that is more compressed at the sides.",
				position: {
					endOffset: 253,
					startOffset: 248,
					startOffsetBlock: 245,
					endOffsetBlock: 250,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
			new Mark( {
				marked: " The red <yoastmark class='yoast-text-mark'>panda</yoastmark> shares this feature with the " +
					"<yoastmark class='yoast-text-mark'>giant panda</yoastmark>, which has a larger sesamoid that is more compressed at the sides.",
				original: " The red panda shares this feature with the giant panda, which has a larger " +
					"sesamoid that is more compressed at the sides.",
				position: {
					endOffset: 298,
					startOffset: 287,
					startOffsetBlock: 284,
					endOffsetBlock: 295,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
	{
		description: "counts keyphrase occurrence correctly when it's found inside an anchor text and outputs correct Marks",
		paper: new Paper( "<p>The forepaws possess a \"false thumb\", which is an extension of a wrist bone, " +
			"the radial sesamoid found in many carnivorans. This thumb allows the animal to grip onto bamboo stalks " +
			"and both the digits and wrist bones are highly flexible. The red panda shares this feature " +
			"with the <a href=\"https://en.wikipedia.org/wiki/Giant_panda\">giant panda</a>, which has a larger sesamoid " +
			"that is more compressed at the sides." +
			" In addition, the red panda's sesamoid has a more sunken tip while the giant panda's curves in the middle.&nbsp;</p>",
		{ keyword: "giant panda", locale: "en_US" } ),
		keyphraseForms: [ [ "giant" ], [ "panda", "pandas" ] ],
		expectedCount: 1,
		expectedMarkings: [
			new Mark( {
				marked: " The red <yoastmark class='yoast-text-mark'>panda</yoastmark> shares this feature with the " +
					"<yoastmark class='yoast-text-mark'>giant panda</yoastmark>, which has a larger sesamoid that is more compressed at the sides.",
				original: " The red panda shares this feature with the giant panda, which has a larger sesamoid " +
					"that is more compressed at the sides.",
				position: {
					endOffset: 253,
					startOffset: 248,
					startOffsetBlock: 245,
					endOffsetBlock: 250,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
			new Mark( {
				marked: " The red <yoastmark class='yoast-text-mark'>panda</yoastmark> shares this feature with the " +
					"<yoastmark class='yoast-text-mark'>giant panda</yoastmark>, which has a larger sesamoid that is more compressed at the sides.",
				original: " The red panda shares this feature with the giant panda, which has a larger " +
					"sesamoid that is more compressed at the sides.",
				position: {
					endOffset: 346,
					startOffset: 335,
					startOffsetBlock: 332,
					endOffsetBlock: 343,
					attributeId: "",
					clientId: "",
					isFirstSection: false,
				},
			} ),
		],
		skip: false,
	},
];

describe.each( testDataForHTMLTags )( "Test for counting the keyphrase in a text containing multiple html tags",
	function( {
		description,
		paper,
		keyphraseForms,
		expectedCount,
		expectedMarkings,
		skip } ) {
		const test = skip ? it.skip : it;

		test( description, function() {
			const mockResearcher = buildMorphologyMockResearcher( keyphraseForms );
			buildTree( paper, mockResearcher );
			const keyphraseCountResult = getKeyphraseCount( paper, mockResearcher );
			expect( keyphraseCountResult.count ).toBe( expectedCount );
			expect( keyphraseCountResult.markings ).toEqual( expectedMarkings );
		} );
	} );

/**
 * Mocks Japanese Researcher.
 * @param {Array} keyphraseForms    The morphological forms to be added to the researcher.
 * @param {function} helper1        A helper needed for the assesment.
 * @param {function} helper2        A helper needed for the assesment.
 *
 * @returns {Researcher} The mock researcher with added morphological forms and custom helper.
 */
const buildJapaneseMockResearcher = function( keyphraseForms, helper1, helper2 ) {
	return factory.buildMockResearcher( {
		morphology: {
			keyphraseForms: keyphraseForms,
		},
	},
	true,
	true,
	false,
	{
		wordsCharacterCount: helper1,
		matchWordCustomHelper: helper2,
		memoizedTokenizer: japaneseMemoizedSentenceTokenizer,
	} );
};

describe( "Test for counting the keyphrase in a text for Japanese", () => {
	// NOTE: Japanese is not yet adapted to use HTML parser, hence, the marking out doesn't include the position information.
	it( "counts/marks a string of text with a keyphrase in it.", function() {
		const mockPaper = new Paper( "<p>私の猫はかわいいです。</p>", { locale: "ja", keyphrase: "猫" } );
		const researcher = buildJapaneseMockResearcher( [ [ "猫" ] ], wordsCountHelper, matchWordsHelper );
		buildTree( mockPaper, researcher );

		expect( getKeyphraseCount( mockPaper, researcher ).count ).toBe( 1 );
		expect( getKeyphraseCount( mockPaper, researcher ).markings ).toEqual( [
			new Mark( { marked: "私の<yoastmark class='yoast-text-mark'>猫</yoastmark>はかわいいです。",
				original: "私の猫はかわいいです。" } ) ] );
	} );

	it( "counts/marks a string of text with multiple occurrences of the same keyphrase in it.", function() {
		const mockPaper = new Paper( "<p>私の猫はかわいい猫です。</p>", { locale: "ja", keyphrase: "猫" } );
		const researcher = buildJapaneseMockResearcher( [ [ "猫" ] ], wordsCountHelper, matchWordsHelper );
		buildTree( mockPaper, researcher );

		expect( getKeyphraseCount( mockPaper, researcher ).count ).toBe( 2 );
		expect( getKeyphraseCount( mockPaper, researcher ).markings ).toEqual( [
			new Mark( { marked: "私の<yoastmark class='yoast-text-mark'>猫</yoastmark>はかわいい<yoastmark class='yoast-text-mark'>猫</yoastmark>です。",
				original: "私の猫はかわいい猫です。",
				 } ) ] );
	} );

	it( "counts a string if text with no keyphrase in it.", function() {
		const mockPaper = new Paper( "<p>私の猫はかわいいです。</p>",  { locale: "ja" } );
		const researcher = buildJapaneseMockResearcher( [ [ "猫" ], [ "会い" ] ], wordsCountHelper, matchWordsHelper );
		buildTree( mockPaper, researcher );
		expect( getKeyphraseCount( mockPaper, researcher ).count ).toBe( 0 );
		expect( getKeyphraseCount( mockPaper, researcher ).markings ).toEqual( [] );
	} );

	it( "counts multiple occurrences of a keyphrase consisting of multiple words.", function() {
		const mockPaper = new Paper( "<p>私の猫はかわいいですかわいい。</p>",  { locale: "ja" } );
		const researcher = buildJapaneseMockResearcher( [ [ "猫" ], [ "かわいい" ] ], wordsCountHelper, matchWordsHelper );
		buildTree( mockPaper, researcher );
		expect( getKeyphraseCount( mockPaper, researcher ).count ).toBe( 1 );
		expect( getKeyphraseCount( mockPaper, researcher ).markings ).toEqual( [
			new Mark( {
				marked: "私の<yoastmark class='yoast-text-mark'>猫</yoastmark>は<yoastmark class='yoast-text-mark'>かわいい</yoastmark>" +
					"です<yoastmark class='yoast-text-mark'>かわいい</yoastmark>。",
				original: "私の猫はかわいいですかわいい。",
			} ),
		] );
	} );
} );
