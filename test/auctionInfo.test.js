// const regeneratorRuntime = require("regenerator-runtime");
import 'regenerator-runtime'
const request = require("supertest");
const server = require('../server');

const baseUrl = '/auctions';
const userId = 'vRFIRjaD06QCygX5rsr9Geye4ZY2';
const auction = { // test auction info
  title: 'in jest test code',
  content: 'test content',
  startPrice: '2',
  reservedPrice: '3',
  startDate: '2021-08-07 14:30',
  endDate: '2021-08-07 16:00',
  uploadTime: '2021-08-07 15:30',
  sellerId: userId,
  category: '{"value":"ETC","label":"기타"}',
  view: '0',
  wish: '0',
  sellingFailure: '0',
  state: 'BEFO'
};
const categories = ['ACC', 'ALL', 'ART', 'BEA', 'CLO', 'DIG', 'ETC', 'FUR', 'LIF', 'SPO']
let auctionId;

describe('AuctionInfo Api Test', () => {
    test('Create AuctionInfo', async() => {
        const url = baseUrl + '/detail';
        const response = await request(server).post(url).send(auction);
        auctionId = response.body.id;
        expect(response.statusCode).toBe(200);
    })

    test('Get All AuctionInfoList', async() => {
        const url = baseUrl + '/list';
        const response = await request(server).get(url);
        expect(response.statusCode).toBe(200);
    });

    test('Get AuctionInfo using user_id', async() => {
        const url = baseUrl + '/list?uid=' +userId;
        const response = await request(server).get(url);
        expect(response.statusCode).toBe(200);
    });

    test('Get AuctionInfoList using category_name', async() => {
       for(const category in categories) {
            const url = baseUrl + '/list/category?category=' + category;
            const response = await request(server).get(url);
            expect(response.statusCode).toBe(200);
        };
    });

    test('Get AuctionInfo using auction_id', async() => {
        const url = baseUrl + '/list/id?auctionId=' + auctionId;
        const response = await request(server).get(url);
        expect(response.statusCode).toBe(200);
    });

    test('Update AuctionInfo', async() => {
        const url = baseUrl + '/detail';
        const response = await request(server).put(url).send({id: auctionId, content: 'updatee'});
        expect(response.statusCode).toBe(200);
    });

    test('Delete AuctionInfo', async() => {
        const url = baseUrl + '/detail/' + auctionId;
        const response = await request(server).delete(url);
        expect(response.statusCode).toBe(200);
    });
});

afterAll((done) => {
    server.close();
    done();
});