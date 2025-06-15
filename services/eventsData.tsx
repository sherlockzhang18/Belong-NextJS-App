import type { EventData, ImageStub } from "@jstiava/chronos";

export const sampleEvents: EventData[] = [
    {
        uuid: "1",
        name: "Intro to Next.js",
        date: 20250701,
        end_date: null, // single‐day event
        start_time: "09.000", // using Chronos’s "hour.fraction" string format
        end_time: "10.500", // 10:30am
        location_name: "Online",
        location_address: null,
        location_place_id: null,
        end_location_name: null,
        end_location_address: null,
        end_location_place_id: null,
        cover_img: { path: "/assets/1.jpg" } as ImageStub,
        icon_img: null,
        wordmark_img: null,
        theme_color: "#0070f3",
        search_vectors: null,
        link: null,
        event_type: null,
        created_on: null,
        last_updated_on: null,
        capacity: null,
        quantity: null,
        subtitle: "Get started with Next.js fundamentals",
        integration: null,
        event_store: null,
        // styling fields
        theme_color_onlight: "#ffffff",
        theme_color_ondark: "#000000",
        // optional metadata
        metadata: {
            description: "Learn how to build SSR and SSG pages in Next.js.",
            price: "$0",
        },
    },
    {
        uuid: "2",
        name: "React Hooks Workshop",
        date: 20250710,
        end_date: null,
        start_time: "14.000", // 2 PM
        end_time: "16.000", // 4 PM
        location_name: "San Francisco, CA",
        location_address: "123 Market St.",
        location_place_id: null,
        end_location_name: null,
        end_location_address: null,
        end_location_place_id: null,
        cover_img: { path: "/assets/2.png" } as ImageStub,
        icon_img: null,
        wordmark_img: null,
        theme_color: "#61dafb",
        search_vectors: null,
        link: null,
        event_type: null,
        created_on: null,
        last_updated_on: null,
        capacity: null,
        quantity: null,
        subtitle: "Deep dive into useState, useEffect, and custom hooks",
        integration: null,
        event_store: null,
        theme_color_onlight: "#000000",
        theme_color_ondark: "#ffffff",
        metadata: {
            description: "Hands-on workshop for building custom React hooks.",
            price: "$49",
        },
    },
];
