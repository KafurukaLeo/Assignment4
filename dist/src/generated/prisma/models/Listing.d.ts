import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
/**
 * Model Listing
 *
 */
export type ListingModel = runtime.Types.Result.DefaultSelection<Prisma.$ListingPayload>;
export type AggregateListing = {
    _count: ListingCountAggregateOutputType | null;
    _avg: ListingAvgAggregateOutputType | null;
    _sum: ListingSumAggregateOutputType | null;
    _min: ListingMinAggregateOutputType | null;
    _max: ListingMaxAggregateOutputType | null;
};
export type ListingAvgAggregateOutputType = {
    id: number | null;
    pricePerNight: number | null;
    guests: number | null;
};
export type ListingSumAggregateOutputType = {
    id: number | null;
    pricePerNight: number | null;
    guests: number | null;
};
export type ListingMinAggregateOutputType = {
    id: number | null;
    title: string | null;
    location: string | null;
    pricePerNight: number | null;
    guests: number | null;
    createdAt: Date | null;
};
export type ListingMaxAggregateOutputType = {
    id: number | null;
    title: string | null;
    location: string | null;
    pricePerNight: number | null;
    guests: number | null;
    createdAt: Date | null;
};
export type ListingCountAggregateOutputType = {
    id: number;
    title: number;
    location: number;
    pricePerNight: number;
    guests: number;
    createdAt: number;
    _all: number;
};
export type ListingAvgAggregateInputType = {
    id?: true;
    pricePerNight?: true;
    guests?: true;
};
export type ListingSumAggregateInputType = {
    id?: true;
    pricePerNight?: true;
    guests?: true;
};
export type ListingMinAggregateInputType = {
    id?: true;
    title?: true;
    location?: true;
    pricePerNight?: true;
    guests?: true;
    createdAt?: true;
};
export type ListingMaxAggregateInputType = {
    id?: true;
    title?: true;
    location?: true;
    pricePerNight?: true;
    guests?: true;
    createdAt?: true;
};
export type ListingCountAggregateInputType = {
    id?: true;
    title?: true;
    location?: true;
    pricePerNight?: true;
    guests?: true;
    createdAt?: true;
    _all?: true;
};
export type ListingAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Listing to aggregate.
     */
    where?: Prisma.ListingWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Listings to fetch.
     */
    orderBy?: Prisma.ListingOrderByWithRelationInput | Prisma.ListingOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.ListingWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Listings from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Listings.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Listings
    **/
    _count?: true | ListingCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: ListingAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: ListingSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: ListingMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: ListingMaxAggregateInputType;
};
export type GetListingAggregateType<T extends ListingAggregateArgs> = {
    [P in keyof T & keyof AggregateListing]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateListing[P]> : Prisma.GetScalarType<T[P], AggregateListing[P]>;
};
export type ListingGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ListingWhereInput;
    orderBy?: Prisma.ListingOrderByWithAggregationInput | Prisma.ListingOrderByWithAggregationInput[];
    by: Prisma.ListingScalarFieldEnum[] | Prisma.ListingScalarFieldEnum;
    having?: Prisma.ListingScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ListingCountAggregateInputType | true;
    _avg?: ListingAvgAggregateInputType;
    _sum?: ListingSumAggregateInputType;
    _min?: ListingMinAggregateInputType;
    _max?: ListingMaxAggregateInputType;
};
export type ListingGroupByOutputType = {
    id: number;
    title: string;
    location: string;
    pricePerNight: number;
    guests: number;
    createdAt: Date;
    _count: ListingCountAggregateOutputType | null;
    _avg: ListingAvgAggregateOutputType | null;
    _sum: ListingSumAggregateOutputType | null;
    _min: ListingMinAggregateOutputType | null;
    _max: ListingMaxAggregateOutputType | null;
};
export type GetListingGroupByPayload<T extends ListingGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<ListingGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof ListingGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], ListingGroupByOutputType[P]> : Prisma.GetScalarType<T[P], ListingGroupByOutputType[P]>;
}>>;
export type ListingWhereInput = {
    AND?: Prisma.ListingWhereInput | Prisma.ListingWhereInput[];
    OR?: Prisma.ListingWhereInput[];
    NOT?: Prisma.ListingWhereInput | Prisma.ListingWhereInput[];
    id?: Prisma.IntFilter<"Listing"> | number;
    title?: Prisma.StringFilter<"Listing"> | string;
    location?: Prisma.StringFilter<"Listing"> | string;
    pricePerNight?: Prisma.FloatFilter<"Listing"> | number;
    guests?: Prisma.IntFilter<"Listing"> | number;
    createdAt?: Prisma.DateTimeFilter<"Listing"> | Date | string;
    bookings?: Prisma.BookingListRelationFilter;
};
export type ListingOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    location?: Prisma.SortOrder;
    pricePerNight?: Prisma.SortOrder;
    guests?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    bookings?: Prisma.BookingOrderByRelationAggregateInput;
};
export type ListingWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    AND?: Prisma.ListingWhereInput | Prisma.ListingWhereInput[];
    OR?: Prisma.ListingWhereInput[];
    NOT?: Prisma.ListingWhereInput | Prisma.ListingWhereInput[];
    title?: Prisma.StringFilter<"Listing"> | string;
    location?: Prisma.StringFilter<"Listing"> | string;
    pricePerNight?: Prisma.FloatFilter<"Listing"> | number;
    guests?: Prisma.IntFilter<"Listing"> | number;
    createdAt?: Prisma.DateTimeFilter<"Listing"> | Date | string;
    bookings?: Prisma.BookingListRelationFilter;
}, "id">;
export type ListingOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    location?: Prisma.SortOrder;
    pricePerNight?: Prisma.SortOrder;
    guests?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.ListingCountOrderByAggregateInput;
    _avg?: Prisma.ListingAvgOrderByAggregateInput;
    _max?: Prisma.ListingMaxOrderByAggregateInput;
    _min?: Prisma.ListingMinOrderByAggregateInput;
    _sum?: Prisma.ListingSumOrderByAggregateInput;
};
export type ListingScalarWhereWithAggregatesInput = {
    AND?: Prisma.ListingScalarWhereWithAggregatesInput | Prisma.ListingScalarWhereWithAggregatesInput[];
    OR?: Prisma.ListingScalarWhereWithAggregatesInput[];
    NOT?: Prisma.ListingScalarWhereWithAggregatesInput | Prisma.ListingScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"Listing"> | number;
    title?: Prisma.StringWithAggregatesFilter<"Listing"> | string;
    location?: Prisma.StringWithAggregatesFilter<"Listing"> | string;
    pricePerNight?: Prisma.FloatWithAggregatesFilter<"Listing"> | number;
    guests?: Prisma.IntWithAggregatesFilter<"Listing"> | number;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Listing"> | Date | string;
};
export type ListingCreateInput = {
    title: string;
    location: string;
    pricePerNight: number;
    guests: number;
    createdAt?: Date | string;
    bookings?: Prisma.BookingCreateNestedManyWithoutListingInput;
};
export type ListingUncheckedCreateInput = {
    id?: number;
    title: string;
    location: string;
    pricePerNight: number;
    guests: number;
    createdAt?: Date | string;
    bookings?: Prisma.BookingUncheckedCreateNestedManyWithoutListingInput;
};
export type ListingUpdateInput = {
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    location?: Prisma.StringFieldUpdateOperationsInput | string;
    pricePerNight?: Prisma.FloatFieldUpdateOperationsInput | number;
    guests?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    bookings?: Prisma.BookingUpdateManyWithoutListingNestedInput;
};
export type ListingUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    location?: Prisma.StringFieldUpdateOperationsInput | string;
    pricePerNight?: Prisma.FloatFieldUpdateOperationsInput | number;
    guests?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    bookings?: Prisma.BookingUncheckedUpdateManyWithoutListingNestedInput;
};
export type ListingCreateManyInput = {
    id?: number;
    title: string;
    location: string;
    pricePerNight: number;
    guests: number;
    createdAt?: Date | string;
};
export type ListingUpdateManyMutationInput = {
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    location?: Prisma.StringFieldUpdateOperationsInput | string;
    pricePerNight?: Prisma.FloatFieldUpdateOperationsInput | number;
    guests?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ListingUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    location?: Prisma.StringFieldUpdateOperationsInput | string;
    pricePerNight?: Prisma.FloatFieldUpdateOperationsInput | number;
    guests?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ListingCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    location?: Prisma.SortOrder;
    pricePerNight?: Prisma.SortOrder;
    guests?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type ListingAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    pricePerNight?: Prisma.SortOrder;
    guests?: Prisma.SortOrder;
};
export type ListingMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    location?: Prisma.SortOrder;
    pricePerNight?: Prisma.SortOrder;
    guests?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type ListingMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    location?: Prisma.SortOrder;
    pricePerNight?: Prisma.SortOrder;
    guests?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type ListingSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    pricePerNight?: Prisma.SortOrder;
    guests?: Prisma.SortOrder;
};
export type ListingScalarRelationFilter = {
    is?: Prisma.ListingWhereInput;
    isNot?: Prisma.ListingWhereInput;
};
export type FloatFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type ListingCreateNestedOneWithoutBookingsInput = {
    create?: Prisma.XOR<Prisma.ListingCreateWithoutBookingsInput, Prisma.ListingUncheckedCreateWithoutBookingsInput>;
    connectOrCreate?: Prisma.ListingCreateOrConnectWithoutBookingsInput;
    connect?: Prisma.ListingWhereUniqueInput;
};
export type ListingUpdateOneRequiredWithoutBookingsNestedInput = {
    create?: Prisma.XOR<Prisma.ListingCreateWithoutBookingsInput, Prisma.ListingUncheckedCreateWithoutBookingsInput>;
    connectOrCreate?: Prisma.ListingCreateOrConnectWithoutBookingsInput;
    upsert?: Prisma.ListingUpsertWithoutBookingsInput;
    connect?: Prisma.ListingWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.ListingUpdateToOneWithWhereWithoutBookingsInput, Prisma.ListingUpdateWithoutBookingsInput>, Prisma.ListingUncheckedUpdateWithoutBookingsInput>;
};
export type ListingCreateWithoutBookingsInput = {
    title: string;
    location: string;
    pricePerNight: number;
    guests: number;
    createdAt?: Date | string;
};
export type ListingUncheckedCreateWithoutBookingsInput = {
    id?: number;
    title: string;
    location: string;
    pricePerNight: number;
    guests: number;
    createdAt?: Date | string;
};
export type ListingCreateOrConnectWithoutBookingsInput = {
    where: Prisma.ListingWhereUniqueInput;
    create: Prisma.XOR<Prisma.ListingCreateWithoutBookingsInput, Prisma.ListingUncheckedCreateWithoutBookingsInput>;
};
export type ListingUpsertWithoutBookingsInput = {
    update: Prisma.XOR<Prisma.ListingUpdateWithoutBookingsInput, Prisma.ListingUncheckedUpdateWithoutBookingsInput>;
    create: Prisma.XOR<Prisma.ListingCreateWithoutBookingsInput, Prisma.ListingUncheckedCreateWithoutBookingsInput>;
    where?: Prisma.ListingWhereInput;
};
export type ListingUpdateToOneWithWhereWithoutBookingsInput = {
    where?: Prisma.ListingWhereInput;
    data: Prisma.XOR<Prisma.ListingUpdateWithoutBookingsInput, Prisma.ListingUncheckedUpdateWithoutBookingsInput>;
};
export type ListingUpdateWithoutBookingsInput = {
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    location?: Prisma.StringFieldUpdateOperationsInput | string;
    pricePerNight?: Prisma.FloatFieldUpdateOperationsInput | number;
    guests?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ListingUncheckedUpdateWithoutBookingsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    location?: Prisma.StringFieldUpdateOperationsInput | string;
    pricePerNight?: Prisma.FloatFieldUpdateOperationsInput | number;
    guests?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
/**
 * Count Type ListingCountOutputType
 */
export type ListingCountOutputType = {
    bookings: number;
};
export type ListingCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    bookings?: boolean | ListingCountOutputTypeCountBookingsArgs;
};
/**
 * ListingCountOutputType without action
 */
export type ListingCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingCountOutputType
     */
    select?: Prisma.ListingCountOutputTypeSelect<ExtArgs> | null;
};
/**
 * ListingCountOutputType without action
 */
export type ListingCountOutputTypeCountBookingsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.BookingWhereInput;
};
export type ListingSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    title?: boolean;
    location?: boolean;
    pricePerNight?: boolean;
    guests?: boolean;
    createdAt?: boolean;
    bookings?: boolean | Prisma.Listing$bookingsArgs<ExtArgs>;
    _count?: boolean | Prisma.ListingCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["listing"]>;
export type ListingSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    title?: boolean;
    location?: boolean;
    pricePerNight?: boolean;
    guests?: boolean;
    createdAt?: boolean;
}, ExtArgs["result"]["listing"]>;
export type ListingSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    title?: boolean;
    location?: boolean;
    pricePerNight?: boolean;
    guests?: boolean;
    createdAt?: boolean;
}, ExtArgs["result"]["listing"]>;
export type ListingSelectScalar = {
    id?: boolean;
    title?: boolean;
    location?: boolean;
    pricePerNight?: boolean;
    guests?: boolean;
    createdAt?: boolean;
};
export type ListingOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "title" | "location" | "pricePerNight" | "guests" | "createdAt", ExtArgs["result"]["listing"]>;
export type ListingInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    bookings?: boolean | Prisma.Listing$bookingsArgs<ExtArgs>;
    _count?: boolean | Prisma.ListingCountOutputTypeDefaultArgs<ExtArgs>;
};
export type ListingIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type ListingIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $ListingPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Listing";
    objects: {
        bookings: Prisma.$BookingPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        title: string;
        location: string;
        pricePerNight: number;
        guests: number;
        createdAt: Date;
    }, ExtArgs["result"]["listing"]>;
    composites: {};
};
export type ListingGetPayload<S extends boolean | null | undefined | ListingDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$ListingPayload, S>;
export type ListingCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<ListingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ListingCountAggregateInputType | true;
};
export interface ListingDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Listing'];
        meta: {
            name: 'Listing';
        };
    };
    /**
     * Find zero or one Listing that matches the filter.
     * @param {ListingFindUniqueArgs} args - Arguments to find a Listing
     * @example
     * // Get one Listing
     * const listing = await prisma.listing.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ListingFindUniqueArgs>(args: Prisma.SelectSubset<T, ListingFindUniqueArgs<ExtArgs>>): Prisma.Prisma__ListingClient<runtime.Types.Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one Listing that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ListingFindUniqueOrThrowArgs} args - Arguments to find a Listing
     * @example
     * // Get one Listing
     * const listing = await prisma.listing.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ListingFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, ListingFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__ListingClient<runtime.Types.Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Listing that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingFindFirstArgs} args - Arguments to find a Listing
     * @example
     * // Get one Listing
     * const listing = await prisma.listing.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ListingFindFirstArgs>(args?: Prisma.SelectSubset<T, ListingFindFirstArgs<ExtArgs>>): Prisma.Prisma__ListingClient<runtime.Types.Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Listing that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingFindFirstOrThrowArgs} args - Arguments to find a Listing
     * @example
     * // Get one Listing
     * const listing = await prisma.listing.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ListingFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, ListingFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__ListingClient<runtime.Types.Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more Listings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Listings
     * const listings = await prisma.listing.findMany()
     *
     * // Get first 10 Listings
     * const listings = await prisma.listing.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const listingWithIdOnly = await prisma.listing.findMany({ select: { id: true } })
     *
     */
    findMany<T extends ListingFindManyArgs>(args?: Prisma.SelectSubset<T, ListingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a Listing.
     * @param {ListingCreateArgs} args - Arguments to create a Listing.
     * @example
     * // Create one Listing
     * const Listing = await prisma.listing.create({
     *   data: {
     *     // ... data to create a Listing
     *   }
     * })
     *
     */
    create<T extends ListingCreateArgs>(args: Prisma.SelectSubset<T, ListingCreateArgs<ExtArgs>>): Prisma.Prisma__ListingClient<runtime.Types.Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many Listings.
     * @param {ListingCreateManyArgs} args - Arguments to create many Listings.
     * @example
     * // Create many Listings
     * const listing = await prisma.listing.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends ListingCreateManyArgs>(args?: Prisma.SelectSubset<T, ListingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many Listings and returns the data saved in the database.
     * @param {ListingCreateManyAndReturnArgs} args - Arguments to create many Listings.
     * @example
     * // Create many Listings
     * const listing = await prisma.listing.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Listings and only return the `id`
     * const listingWithIdOnly = await prisma.listing.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends ListingCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, ListingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a Listing.
     * @param {ListingDeleteArgs} args - Arguments to delete one Listing.
     * @example
     * // Delete one Listing
     * const Listing = await prisma.listing.delete({
     *   where: {
     *     // ... filter to delete one Listing
     *   }
     * })
     *
     */
    delete<T extends ListingDeleteArgs>(args: Prisma.SelectSubset<T, ListingDeleteArgs<ExtArgs>>): Prisma.Prisma__ListingClient<runtime.Types.Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one Listing.
     * @param {ListingUpdateArgs} args - Arguments to update one Listing.
     * @example
     * // Update one Listing
     * const listing = await prisma.listing.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends ListingUpdateArgs>(args: Prisma.SelectSubset<T, ListingUpdateArgs<ExtArgs>>): Prisma.Prisma__ListingClient<runtime.Types.Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more Listings.
     * @param {ListingDeleteManyArgs} args - Arguments to filter Listings to delete.
     * @example
     * // Delete a few Listings
     * const { count } = await prisma.listing.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends ListingDeleteManyArgs>(args?: Prisma.SelectSubset<T, ListingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Listings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Listings
     * const listing = await prisma.listing.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends ListingUpdateManyArgs>(args: Prisma.SelectSubset<T, ListingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Listings and returns the data updated in the database.
     * @param {ListingUpdateManyAndReturnArgs} args - Arguments to update many Listings.
     * @example
     * // Update many Listings
     * const listing = await prisma.listing.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Listings and only return the `id`
     * const listingWithIdOnly = await prisma.listing.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends ListingUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, ListingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one Listing.
     * @param {ListingUpsertArgs} args - Arguments to update or create a Listing.
     * @example
     * // Update or create a Listing
     * const listing = await prisma.listing.upsert({
     *   create: {
     *     // ... data to create a Listing
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Listing we want to update
     *   }
     * })
     */
    upsert<T extends ListingUpsertArgs>(args: Prisma.SelectSubset<T, ListingUpsertArgs<ExtArgs>>): Prisma.Prisma__ListingClient<runtime.Types.Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of Listings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingCountArgs} args - Arguments to filter Listings to count.
     * @example
     * // Count the number of Listings
     * const count = await prisma.listing.count({
     *   where: {
     *     // ... the filter for the Listings we want to count
     *   }
     * })
    **/
    count<T extends ListingCountArgs>(args?: Prisma.Subset<T, ListingCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], ListingCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a Listing.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ListingAggregateArgs>(args: Prisma.Subset<T, ListingAggregateArgs>): Prisma.PrismaPromise<GetListingAggregateType<T>>;
    /**
     * Group by Listing.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<T extends ListingGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: ListingGroupByArgs['orderBy'];
    } : {
        orderBy?: ListingGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, ListingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetListingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Listing model
     */
    readonly fields: ListingFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for Listing.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__ListingClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    bookings<T extends Prisma.Listing$bookingsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Listing$bookingsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
/**
 * Fields of the Listing model
 */
export interface ListingFieldRefs {
    readonly id: Prisma.FieldRef<"Listing", 'Int'>;
    readonly title: Prisma.FieldRef<"Listing", 'String'>;
    readonly location: Prisma.FieldRef<"Listing", 'String'>;
    readonly pricePerNight: Prisma.FieldRef<"Listing", 'Float'>;
    readonly guests: Prisma.FieldRef<"Listing", 'Int'>;
    readonly createdAt: Prisma.FieldRef<"Listing", 'DateTime'>;
}
/**
 * Listing findUnique
 */
export type ListingFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: Prisma.ListingSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Listing
     */
    omit?: Prisma.ListingOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ListingInclude<ExtArgs> | null;
    /**
     * Filter, which Listing to fetch.
     */
    where: Prisma.ListingWhereUniqueInput;
};
/**
 * Listing findUniqueOrThrow
 */
export type ListingFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: Prisma.ListingSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Listing
     */
    omit?: Prisma.ListingOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ListingInclude<ExtArgs> | null;
    /**
     * Filter, which Listing to fetch.
     */
    where: Prisma.ListingWhereUniqueInput;
};
/**
 * Listing findFirst
 */
export type ListingFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: Prisma.ListingSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Listing
     */
    omit?: Prisma.ListingOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ListingInclude<ExtArgs> | null;
    /**
     * Filter, which Listing to fetch.
     */
    where?: Prisma.ListingWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Listings to fetch.
     */
    orderBy?: Prisma.ListingOrderByWithRelationInput | Prisma.ListingOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Listings.
     */
    cursor?: Prisma.ListingWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Listings from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Listings.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Listings.
     */
    distinct?: Prisma.ListingScalarFieldEnum | Prisma.ListingScalarFieldEnum[];
};
/**
 * Listing findFirstOrThrow
 */
export type ListingFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: Prisma.ListingSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Listing
     */
    omit?: Prisma.ListingOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ListingInclude<ExtArgs> | null;
    /**
     * Filter, which Listing to fetch.
     */
    where?: Prisma.ListingWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Listings to fetch.
     */
    orderBy?: Prisma.ListingOrderByWithRelationInput | Prisma.ListingOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Listings.
     */
    cursor?: Prisma.ListingWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Listings from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Listings.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Listings.
     */
    distinct?: Prisma.ListingScalarFieldEnum | Prisma.ListingScalarFieldEnum[];
};
/**
 * Listing findMany
 */
export type ListingFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: Prisma.ListingSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Listing
     */
    omit?: Prisma.ListingOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ListingInclude<ExtArgs> | null;
    /**
     * Filter, which Listings to fetch.
     */
    where?: Prisma.ListingWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Listings to fetch.
     */
    orderBy?: Prisma.ListingOrderByWithRelationInput | Prisma.ListingOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Listings.
     */
    cursor?: Prisma.ListingWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Listings from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Listings.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Listings.
     */
    distinct?: Prisma.ListingScalarFieldEnum | Prisma.ListingScalarFieldEnum[];
};
/**
 * Listing create
 */
export type ListingCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: Prisma.ListingSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Listing
     */
    omit?: Prisma.ListingOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ListingInclude<ExtArgs> | null;
    /**
     * The data needed to create a Listing.
     */
    data: Prisma.XOR<Prisma.ListingCreateInput, Prisma.ListingUncheckedCreateInput>;
};
/**
 * Listing createMany
 */
export type ListingCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many Listings.
     */
    data: Prisma.ListingCreateManyInput | Prisma.ListingCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * Listing createManyAndReturn
 */
export type ListingCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: Prisma.ListingSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Listing
     */
    omit?: Prisma.ListingOmit<ExtArgs> | null;
    /**
     * The data used to create many Listings.
     */
    data: Prisma.ListingCreateManyInput | Prisma.ListingCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * Listing update
 */
export type ListingUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: Prisma.ListingSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Listing
     */
    omit?: Prisma.ListingOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ListingInclude<ExtArgs> | null;
    /**
     * The data needed to update a Listing.
     */
    data: Prisma.XOR<Prisma.ListingUpdateInput, Prisma.ListingUncheckedUpdateInput>;
    /**
     * Choose, which Listing to update.
     */
    where: Prisma.ListingWhereUniqueInput;
};
/**
 * Listing updateMany
 */
export type ListingUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update Listings.
     */
    data: Prisma.XOR<Prisma.ListingUpdateManyMutationInput, Prisma.ListingUncheckedUpdateManyInput>;
    /**
     * Filter which Listings to update
     */
    where?: Prisma.ListingWhereInput;
    /**
     * Limit how many Listings to update.
     */
    limit?: number;
};
/**
 * Listing updateManyAndReturn
 */
export type ListingUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: Prisma.ListingSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Listing
     */
    omit?: Prisma.ListingOmit<ExtArgs> | null;
    /**
     * The data used to update Listings.
     */
    data: Prisma.XOR<Prisma.ListingUpdateManyMutationInput, Prisma.ListingUncheckedUpdateManyInput>;
    /**
     * Filter which Listings to update
     */
    where?: Prisma.ListingWhereInput;
    /**
     * Limit how many Listings to update.
     */
    limit?: number;
};
/**
 * Listing upsert
 */
export type ListingUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: Prisma.ListingSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Listing
     */
    omit?: Prisma.ListingOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ListingInclude<ExtArgs> | null;
    /**
     * The filter to search for the Listing to update in case it exists.
     */
    where: Prisma.ListingWhereUniqueInput;
    /**
     * In case the Listing found by the `where` argument doesn't exist, create a new Listing with this data.
     */
    create: Prisma.XOR<Prisma.ListingCreateInput, Prisma.ListingUncheckedCreateInput>;
    /**
     * In case the Listing was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.ListingUpdateInput, Prisma.ListingUncheckedUpdateInput>;
};
/**
 * Listing delete
 */
export type ListingDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: Prisma.ListingSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Listing
     */
    omit?: Prisma.ListingOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ListingInclude<ExtArgs> | null;
    /**
     * Filter which Listing to delete.
     */
    where: Prisma.ListingWhereUniqueInput;
};
/**
 * Listing deleteMany
 */
export type ListingDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Listings to delete
     */
    where?: Prisma.ListingWhereInput;
    /**
     * Limit how many Listings to delete.
     */
    limit?: number;
};
/**
 * Listing.bookings
 */
export type Listing$bookingsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: Prisma.BookingSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Booking
     */
    omit?: Prisma.BookingOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.BookingInclude<ExtArgs> | null;
    where?: Prisma.BookingWhereInput;
    orderBy?: Prisma.BookingOrderByWithRelationInput | Prisma.BookingOrderByWithRelationInput[];
    cursor?: Prisma.BookingWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.BookingScalarFieldEnum | Prisma.BookingScalarFieldEnum[];
};
/**
 * Listing without action
 */
export type ListingDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: Prisma.ListingSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Listing
     */
    omit?: Prisma.ListingOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ListingInclude<ExtArgs> | null;
};
//# sourceMappingURL=Listing.d.ts.map