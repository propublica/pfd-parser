const _ = require('highland'),
    chai = require('chai'),
    dsv = require('d3-dsv'),
    fs = require('fs'),
    path = require('path'),
    parser = require('../lib/parser'),
    vfs = require('vinyl-fs');

let should = chai.should();
const expect = chai.expect;

const filingPath = __dirname + '/data/pfd/';
const csvPath = __dirname + '/data/csv/';

const integrityFiling = filingPath + 'Kushner, Jared.pdf',
    fdmFiling = filingPath + 'Donnelly, Sally.pdf',
    fdOnlineFiling = filingPath + 'Mashburn, Lori K.pdf',
    giftsFiling = filingPath + 'Bryan-Stirling-2026-278ANNU.pdf',
    corruptFiling = filingPath + 'Nesheiwat, Julia  finalEA.pdf';

// Converts a table name to the slug used in CSV filenames, matching filing.js logic
function slugify(name) {
    return name.toLowerCase().replace(/[ ,']+/g, '-');
}

// Finds a table in the filing whose name slug matches the CSV filename (without .csv)
function findTableForCsv(filing, csvFilename) {
    const slug = csvFilename.replace('.csv', '');
    return filing.tables.find(t => slugify(t.name) === slug);
}

// Compares a parsed table's rows against a reference CSV file row-by-row.
// The reference CSV has a leading 'file' column which is stripped before comparison.
// Missing keys in in-memory rows are treated as empty string (matching CSV behavior).
function compareTableToCSV(table, refCsvPath) {
    const content = fs.readFileSync(refCsvPath, 'utf8');
    const refRows = dsv.csvParse(content);
    const cols = refRows.columns.filter(c => c !== 'file');

    expect(table.rows.length).to.equal(refRows.length,
        `row count mismatch for ${path.basename(refCsvPath)}`);

    table.rows.forEach((row, i) => {
        cols.forEach(col => {
            const actual = row[col] !== undefined ? String(row[col]) : '';
            const expected = refRows[i][col] !== undefined ? refRows[i][col] : '';
            expect(actual).to.equal(expected,
                `row ${i}, column "${col}" in ${path.basename(refCsvPath)}`);
        });
    });
}

// Returns sorted list of .csv filenames in the given reference directory
function csvFilesIn(dir) {
    return fs.readdirSync(dir)
        .filter(f => f.endsWith('.csv'))
        .sort();
}

describe('lib/parser.js', () => {
    it('should find seven tables in Integrity filing', (done) => {
        parser(integrityFiling)
            .then((filings) => {
                filings[0].tables.length.should.equal(7);

                done();
            });
    }).timeout(4000);

    // NOTE: We have not corrected this issue yet, but adding test to document the issue
    it.skip('should correctly parse the liabilties table in the Integrity filing', (done) => {
        parser(integrityFiling)
            .then((filings) => {
                const liabilities = filings[0].tables.find(t => t.name === 'Liabilities');
                console.log("liabilities.rows", liabilities.rows);
                const badRow = liabilities.rows.find(r => r['year-incurred'] === "INCURRED")
                expect(badRow).to.be.undefined;
                liabilities.rows.length.should.equal(13);

                done();
            });
    });

    it('should find seven tables in example FDM filing', (done) => {
        parser(fdmFiling)
            .then((filings) => {
                filings[0].tables.length.should.equal(7);

                done();
            });
    });

    it('should find seven tables in example FDonline filing', (done) => {
        parser(fdOnlineFiling)
            .then((filings) => {
                filings[0].tables.length.should.equal(7);

                done();
            });
    });

    it('should repair and find zero tables in corrupt PDF', (done) => {
        parser(corruptFiling)
            .then((filings) => {
                filings[0].tables.length.should.equal(0);

                done();
            });
    }).timeout(4000);

    it('should extract gifts and liabilities from example filing', (done) => {
        parser(giftsFiling)
            .then((filings) => {
                filings[0].tables.length.should.equal(8);
                const gifts = filings[0].tables.find(t => t.name === 'Gifts and Travel Reimbursements');
                gifts.rows.length.should.equal(1);
                const liabilities = filings[0].tables.find(t => t.name === 'Liabilities');
                liabilities.rows.length.should.equal(2);

                done();
            });
    });
});

describe('data: Donnelly, Sally.pdf', () => {
    let filing;

    before(function(done) {
        this.timeout(8000);
        parser(fdmFiling).then((filings) => {
            filing = filings[0];
            done();
        });
    });

    csvFilesIn(csvPath + 'donnelly').forEach((csvFile) => {
        it('should match reference data for ' + csvFile, () => {
            const table = findTableForCsv(filing, csvFile);
            expect(table).to.exist;
            compareTableToCSV(table, csvPath + 'donnelly/' + csvFile);
        });
    });
});

describe('data: Mashburn, Lori K.pdf', () => {
    let filing;

    before(function(done) {
        this.timeout(8000);
        parser(fdOnlineFiling).then((filings) => {
            filing = filings[0];
            done();
        });
    });

    csvFilesIn(csvPath + 'mashburn').forEach((csvFile) => {
        it('should match reference data for ' + csvFile, () => {
            const table = findTableForCsv(filing, csvFile);
            expect(table).to.exist;
            compareTableToCSV(table, csvPath + 'mashburn/' + csvFile);
        });
    });
});

describe.skip('data: Kushner, Jared.pdf', () => {
    let filing;

    before(function(done) {
        this.timeout(8000);
        parser(integrityFiling).then((filings) => {
            filing = filings[0];
            done();
        });
    });

    csvFilesIn(csvPath + 'kushner').forEach((csvFile) => {
        it('should match reference data for ' + csvFile, () => {
            const table = findTableForCsv(filing, csvFile);
            expect(table).to.exist;
            compareTableToCSV(table, csvPath + 'kushner/' + csvFile);
        });
    });
});

describe.skip('data: Bryan-Stirling-2026-278ANNU.pdf', () => {
    let filing;

    before(function(done) {
        this.timeout(8000);
        parser(giftsFiling).then((filings) => {
            filing = filings[0];
            done();
        });
    });

    csvFilesIn(csvPath + 'bryan').forEach((csvFile) => {
        it('should match reference data for ' + csvFile, () => {
            const table = findTableForCsv(filing, csvFile);
            expect(table).to.exist;
            compareTableToCSV(table, csvPath + 'bryan/' + csvFile);
        });
    });
});
