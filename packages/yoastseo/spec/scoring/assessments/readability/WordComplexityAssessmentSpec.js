import wordComplexityConfigEnglish from "../../../../src/languageProcessing/languages/en/config/wordComplexity";
import EnglishResearcher from "../../../../src/languageProcessing/languages/en/Researcher";
import DefaultResearcher from "../../../../src/languageProcessing/languages/_default/Researcher";
import WordComplexityAssessment from "../../../../src/scoring/assessments/readability/WordComplexityAssessment.js";
import Paper from "../../../../src/values/Paper.js";
import Mark from "../../../../src/values/Mark";
import wordComplexity from "../../../../src/languageProcessing/researches/wordComplexity";
import wordComplexityHelperEnglish from "../../../../src/languageProcessing/languages/en/helpers/checkIfWordIsComplex";
import getMorphologyData from "../../../specHelpers/getMorphologyData";

let assessment = new WordComplexityAssessment();
const morphologyData = getMorphologyData( "en" );

describe( "a test for an assessment that checks complex words in a text", function() {
	let researcher;

	beforeEach( () => {
		researcher = new EnglishResearcher();
		researcher.addResearch( "wordComplexity", wordComplexity );
		researcher.addHelper( "checkIfWordIsComplex", wordComplexityHelperEnglish );
		researcher.addConfig( "wordComplexity", wordComplexityConfigEnglish );
		researcher.addResearchData( "morphology", morphologyData );
	} );

	it( "should return with score 9 if the complex words are less than 10% in the text", function() {
		const paper = new Paper( "This is short text. This is another short text. This is another short text. " +
			"This is another short text. This is another short text. This is another short text. This is another short text. " +
			"This is another short text. This is another short text. This is another short text. This is another short text. " +
			"This is another short text. This is another short text. Torbie cats with a predominantly white undercoat are " +
			"often referred to as \"caliby\", an amalgamation of Calico and Tabby." );
		researcher.setPaper( paper );

		const result = assessment.getResult( paper, researcher );

		expect( result.getScore() ).toBe( 9 );
		expect( result.getText() ).toBe( "<a href='https://yoa.st/4ls' target='_blank'>Word complexity</a>: " +
			"You are not using too many complex words, which makes your text easy to read. Good job!" );
		expect( result.hasMarks() ).toBe( true );
		expect( assessment.getMarks( paper, researcher ) ).toEqual( [
			{ _properties:
					{ 	fieldsToMark: [],
						marked: "Torbie cats with a <yoastmark class='yoast-text-mark'>predominantly</yoastmark> white " +
							"<yoastmark class='yoast-text-mark'>undercoat</yoastmark> are often referred to as " +
							"\"caliby\", an <yoastmark class='yoast-text-mark'>amalgamation</yoastmark> of Calico and Tabby.",
						original: "Torbie cats with a predominantly white undercoat are often referred to as \"caliby\", " +
						"an amalgamation of Calico and Tabby." },
			} ]
		);
		expect( result.hasBetaBadge() ).toBe( false );
	} );

	let runningPaper = new Paper( "Also called torties for short, tortoiseshell cats combine two colors other than white, " +
		"either closely mixed or in larger patches." +
		" The colors are often described as red and black, but the \"red\" patches can instead be orange, yellow, or cream," +
		" and the \"black\" can instead be chocolate, gray, tabby, or blue. Tortoiseshell cats with the tabby pattern as one of their colors " +
		"are sometimes referred to as a torbie. Cats having torbie coats are sometimes referred to as torbie cats.\n" +
		"\"Tortoiseshell\" is typically reserved for particolored cats with relatively small or no white markings. " +
		"Those that are predominantly white with tortoiseshell patches are described as tricolor, tortoiseshell-and-white " +
		"(in the United Kingdom), or calico (in Canada and the United States).\n" +
		"Cats with tortoiseshell pattern and small blotches of white are sometimes referred to as \"tortico\" by their owners, " +
		"a portmanteau of \"tortie\" and \"calico\"\n" +
		"Torbie cats with a predominantly white undercoat are often referred to as \"caliby\" by their respective owners, " +
		"an amalgamation of Calico and Tabby." +
		"Torbie cats with a predominantly white undercoat are often referred to as \"caliby\" by their respective owners, " +
		"an amalgamation of Calico and Tabby." );

	it( "should return with score 6 if the complex words are more than 10% in the text", function() {
		researcher.setPaper( runningPaper );

		const result = assessment.getResult( runningPaper, researcher );

		expect( result.getScore() ).toBe( 6 );
		expect( result.getText() ).toBe( "<a href='https://yoa.st/4ls' target='_blank'>Word complexity</a>: 10.64% of the words in " +
			"your text are considered complex. <a href='https://yoa.st/4lt' target='_blank'>Try to use shorter and more familiar words " +
			"to improve readability</a>." );
		expect( result.hasMarks() ).toBe( true );
	} );

	it( "should return with score 3 if the complex words are more than 10% in the text and the cornerstone toggle is on", function() {
		researcher.setPaper( runningPaper );

		assessment = new WordComplexityAssessment( {
			scores: {
				acceptableAmount: 3,
			},
		} );
		const result = assessment.getResult( runningPaper, researcher );

		expect( result.getScore() ).toBe( 3 );
		expect( result.getText() ).toBe( "<a href='https://yoa.st/4ls' target='_blank'>Word complexity</a>: 10.64% of the words in " +
			"your text are considered complex. <a href='https://yoa.st/4lt' target='_blank'>Try to use shorter and more familiar words " +
			"to improve readability</a>." );
		expect( result.hasMarks() ).toBe( true );
	} );

	it( "should not break the assessment when the text contains backslashes ", function() {
		runningPaper = new Paper( "It is a \\\"tortoiseshell\\\" cat. It is lovely and lovable." );
		researcher.setPaper( runningPaper );

		assessment = new WordComplexityAssessment( {
			scores: {
				acceptableAmount: 3,
			},
		} );
		const result = assessment.getResult( runningPaper, researcher );

		expect( result.getScore() ).toBe( 3 );
		expect( result.getText() ).toBe( "<a href='https://yoa.st/4ls' target='_blank'>Word complexity</a>: 10% of the words in " +
			"your text are considered complex. <a href='https://yoa.st/4lt' target='_blank'>Try to use shorter and more familiar words " +
			"to improve readability</a>." );
		expect( result.hasMarks() ).toBe( true );
	} );

	it( "should be able recognize complex words in image caption and return maker", function() {
		runningPaper = new Paper( "<p><img class='size-medium wp-image-33' src='http://basic.wordpress.test/wp-content/uploads/2021/08/" +
			"cat-3957861_1280-211x300.jpeg' alt='a different cat with toy' width='211' height='300'></img> " +
			"A flamboyant looking cat.<br></br>\n" +
			"</p>" );
		researcher.setPaper( runningPaper );
		const expected = [
			new Mark( {
				original: "A flamboyant looking cat.",
				marked: "A <yoastmark class='yoast-text-mark'>flamboyant</yoastmark> looking cat." } ),
		];
		expect( assessment.getMarks( runningPaper, researcher ) ).toEqual( expected );
	} );
} );

describe( "tests for the assessment applicability", function() {
	describe( "applicability test in English", () => {
		let researcher;

		beforeEach( () => {
			researcher = new EnglishResearcher();
			researcher.addResearch( "wordComplexity", wordComplexity );
			researcher.addHelper( "checkIfWordIsComplex", wordComplexityHelperEnglish );
			researcher.addConfig( "wordComplexity", wordComplexityConfigEnglish );
			researcher.addResearchData( "morphology", morphologyData );
		} );

		it( "returns false if there is no text available.", function() {
			const paper = new Paper( "" );
			researcher.setPaper( paper );
			expect( assessment.isApplicable( paper, researcher ) ).toBe( false );
		} );

		it( "returns false if the text is too short", function() {
			const paper = new Paper( "hallo" );
			researcher.setPaper( paper );

			expect( assessment.isApplicable( paper, researcher ) ).toBe( false );
		} );

		it( "should return false for isApplicable for a paper with only an image.", function() {
			const paper = new Paper( "<img src='https://example.com/image.png' alt='test'>" );
			researcher.setPaper( paper );

			expect( assessment.isApplicable( paper, researcher ) ).toBe( false );
		} );

		it( "should return false for isApplicable for a paper with only spaces.", function() {
			const paper = new Paper( "        " );
			researcher.setPaper( paper );

			expect( assessment.isApplicable( paper, researcher ) ).toBe( false );
		} );

		it( "should return true for isApplicable if the paper has enough content and the researcher has the wordComplexity research", () => {
			const paper = new Paper( "Also called torties for short, tortoiseshell cats combine two colors other than white, " +
				"either closely mixed or in larger patches." +
				" The colors are often described as red and black, but the \"red\" patches can instead be orange, yellow, or cream," +
				" and the \"black\" can instead be chocolate, gray, tabby, or blue. Tortoiseshell cats with the tabby " +
				"pattern as one of their colors " +
				"are sometimes referred to as a torbie. Cats having torbie coats are sometimes referred to as torbie cats.\n" +
				"\"Tortoiseshell\" is typically reserved for particolored cats with relatively small or no white markings. " );
			researcher.setPaper( paper );

			expect( assessment.isApplicable( paper, researcher ) ).toBe( true );
		} );
	} );

	it( "should return false for isApplicable if the paper has enough content but the researcher doesn't have the wordComplexity research", () => {
		const paper = new Paper( "Also called torties for short, tortoiseshell cats combine two colors other than white, " +
			"either closely mixed or in larger patches." +
			" The colors are often described as red and black, but the \"red\" patches can instead be orange, yellow, or cream," +
			" and the \"black\" can instead be chocolate, gray, tabby, or blue. Tortoiseshell cats with the tabby pattern as one of their colors " +
			"are sometimes referred to as a torbie. Cats having torbie coats are sometimes referred to as torbie cats.\n" +
			"\"Tortoiseshell\" is typically reserved for particolored cats with relatively small or no white markings. " );
		expect( assessment.isApplicable( paper, new DefaultResearcher( paper ) ) ).toBe( false );
	} );
} );

