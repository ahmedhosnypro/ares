export interface SupplierReviewsLabels {
  metaTitle: string;
  metaDescription: string;
  title: string;
  description: string;
  filters: {
    vehicle: string;
    allVehicles: string;
    rating: string;
    allRatings: string;
    fiveStars: string;
    fourStars: string;
    threeStars: string;
    twoStars: string;
    oneStar: string;
    reply: string;
    allReplies: string;
    replied: string;
    notReplied: string;
    from: string;
    to: string;
    sort: string;
    newestFirst: string;
    oldestFirst: string;
    highestRating: string;
    lowestRating: string;
  };
  stats: {
    averageRating: string;
    acrossAllVehicles: string;
    totalReviews: string;
    lifetimeCustomerReviews: string;
    fiveStarReviews: string;
    topRatedBookings: string;
    pendingReplies: string;
    reviewsAwaitingReply: string;
  };
  table: {
    customer: string;
    vehicle: string;
    rating: string;
    comment: string;
    date: string;
    reply: string;
    actions: string;
    showing: string;
    of: string;
    reviews: string;
    reported: string;
    replied: string;
    pending: string;
    noComment: string;
    customerDefault: string;
    viewDetails: string;
    editReply: string;
    replyAction: string;
    updateReport: string;
    reportReview: string;
  };
  empty: {
    noReviewsMatchFilters: string;
    noReviewsYet: string;
    tryClearingFilters: string;
    reviewsWillAppear: string;
  };
  toasts: {
    replyUpdated: string;
    replySubmitted: string;
    failedToSaveReply: string;
    reportUpdated: string;
    reviewReported: string;
    failedToReportReview: string;
  };
  errors: {
    notSignedInReviews: string;
    loadReviewsFailed: string;
    notSignedInStats: string;
    loadStatsFailed: string;
  };
  replyDialog: {
    editTitle: string;
    replyTitle: string;
    customerDefault: string;
    vehicleLabel: string;
    noComment: string;
    editAlert: string;
    yourReply: string;
    replyPlaceholder: string;
    charactersCount: string;
    validation: {
      required: string;
      maxLength: string;
    };
    submitReply: string;
    saveChanges: string;
  };
  reportDialog: {
    updateTitle: string;
    reportTitle: string;
    description: string;
    editAlert: string;
    reason: string;
    chooseReason: string;
    presetReasons: {
      inappropriateLanguage: string;
      spamOrAdvertising: string;
      personalAttack: string;
      untrueInformation: string;
      disclosesPrivateInfo: string;
      offTopic: string;
      other: string;
    };
    additionalDetails: string;
    detailsPlaceholder: string;
    willBeSubmitted: string;
    charactersCount: string;
    validation: {
      required: string;
      maxLength: string;
    };
    submitReport: string;
  };
  detailsDialog: {
    title: string;
    customerDefault: string;
    reviewedOn: string;
    year: string;
    customerComment: string;
    noComment: string;
    yourReply: string;
    replied: string;
    notRepliedYet: string;
    reportedLabel: string;
    noReasonRecorded: string;
    editReply: string;
    reply: string;
    updateReport: string;
    report: string;
  };
}
