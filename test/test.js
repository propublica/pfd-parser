const _ = require('highland'),
    chai = require('chai'),
    parser = require('../lib/parser'),
    vfs = require('vinyl-fs');

let should = chai.should();

const filingPath = __dirname + '/data/';

const integrityFiling = filingPath + 'Kushner, Jared.pdf',
    fdmFiling = filingPath + 'Donnelly, Sally.pdf',
    fdOnlineFiling = filingPath + 'Mashburn, Lori K.pdf',
    giftsFiling = filingPath + 'Bryan-Stirling-2026-278ANNU.pdf',
    corruptFiling = filingPath + 'Nesheiwat, Julia  finalEA.pdf';

describe('lib/parser.js', () => {
    it('should find seven tables in Integrity filing', (done) => {
        parser(integrityFiling)
            .then((filings) => {
                filings[0].tables.length.should.equal(7);

                done();
            });
    }).timeout(4000);

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
    });

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
