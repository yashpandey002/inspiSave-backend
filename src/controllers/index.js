import { Client } from '@notionhq/client';
import { asyncHandler } from '../utils.js';
import axios from 'axios';

const authenticateUser = asyncHandler(async (req, res) => {
    const { authCode } = req.body;
    if (!authCode) {
        return res.status(400).json({
            code: 400,
            message: 'User auth code not found',
        });
    }

    const encoded = Buffer.from(
        `${process.env.OAUTH_CLIENT_ID}:${process.env.OAUTH_CLIENT_SECRET}`
    ).toString('base64');
    const result = await axios({
        url: 'https://api.notion.com/v1/oauth/token',
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${encoded}`,
        },
        data: {
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: process.env.REDIRECT_URL,
        },
    });
    if (result.data.error) {
        console.log(result);
        return res.status(500).json({
            code: 500,
            message: 'Something went wrong, please try again!',
        });
    }

    const notion = new Client({ auth: result.data.access_token });

    const database = await notion.search({
        filter: {
            value: 'database',
            property: 'object',
        },
    });

    res.status(200).json({
        code: 200,
        message: 'User authenticated successfully',
        data: {
            access_token: result.data.access_token,
            database_id: database.results[0].id,
        },
    });
});

const savePageToNotion = asyncHandler(async (req, res) => {
    const { screenShotImage, databaseId, pageTitle, pageUrl } = req.body;
    const accessToken = req.headers.authorization.split(' ')[1];

    if (
        !accessToken ||
        !screenShotImage ||
        !screenShotImage.startsWith('data:image/') ||
        !databaseId ||
        !pageTitle ||
        !pageUrl
    ) {
        return res.status(400).json({
            code: 400,
            success: false,
            message:
                'Bad request, make sure all necessary data is sent and is in right format',
        });
    }

    let imageUrl;
    try {
        const uploadedScreenShot = await axios({
            method: 'post',
            url: 'https://api.imgur.com/3/image',
            headers: {
                Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
            },
            data: {
                image: screenShotImage.split(',')[1],
                type: 'base64',
            },
        });

        imageUrl = uploadedScreenShot.data.data.link;
    } catch (error) {
        return res.status(500).json({
            code: 500,
            success: false,
            message: `Failed to upload image to Imgur`,
        });
    }

    const notion = new Client({ auth: accessToken });
    try {
        await notion.pages.create({
            parent: { type: 'database_id', database_id: databaseId },
            properties: {
                Name: {
                    title: [
                        {
                            text: {
                                content: pageTitle,
                            },
                        },
                    ],
                },
                URL: {
                    url: pageUrl,
                },
            },
            children: [
                {
                    type: 'embed',
                    embed: {
                        url: imageUrl,
                    },
                },
            ],
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            success: false,
            message: 'Something went wrong from Notion side',
        });
    }

    res.status(201).json({
        code: 201,
        success: true,
        message: 'Screenshot added successfully to Notion DB',
    });
});

export { authenticateUser, savePageToNotion };
