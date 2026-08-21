/**
 * Export loadData calls from ducks modules of different containers
 */
import { loadData as AdminClassesPageLoader } from './AdminClassesPage/AdminClassesPage.duck';
import { loadData as AdminOverviewPageLoader } from './AdminOverviewPage/AdminOverviewPage.duck';
import { loadData as AdminTeachersPageLoader } from './AdminTeachersPage/AdminTeachersPage.duck';
import { loadData as AdminVenuesPageLoader } from './AdminVenuesPage/AdminVenuesPage.duck';
import { loadData as TeacherDashboardPageLoader } from './TeacherDashboardPage/TeacherDashboardPage.duck';
import { loadData as VenueDashboardPageLoader } from './VenueDashboardPage/VenueDashboardPage.duck';
import { loadData as AuthenticationPageLoader } from './AuthenticationPage/AuthenticationPage.duck';
import { loadData as LandingPageLoader } from './LandingPage/LandingPage.duck';
import { setInitialValues as CheckoutPageInitialValues } from './CheckoutPage/CheckoutPage.duck';
import { loadData as CMSPageLoader } from './CMSPage/CMSPage.duck';
import { loadData as ContactDetailsPageLoader } from './ContactDetailsPage/ContactDetailsPage.duck';
import { loadData as EditListingPageLoader } from './EditListingPage/EditListingPage.duck';
import { loadData as EmailVerificationPageLoader } from './EmailVerificationPage/EmailVerificationPage.duck';
import { loadData as InboxPageLoader } from './InboxPage/InboxPage.duck';
import { loadData as ListingPageLoader } from './ListingPage/ListingPage.duck';
import { loadData as MakeOfferPageLoader } from './MakeOfferPage/MakeOfferPage.duck';
import { loadData as ManageListingsPageLoader } from './ManageListingsPage/ManageListingsPage.duck';
import { loadData as PaymentMethodsPageLoader } from './PaymentMethodsPage/PaymentMethodsPage.duck';
import { loadData as PrivacyPolicyPageLoader } from './PrivacyPolicyPage/PrivacyPolicyPage.duck';
import { loadData as ProfilePageLoader } from './ProfilePage/ProfilePage.duck';
import { loadData as RequestQuotePageLoader } from './RequestQuotePage/RequestQuotePage.duck';
import { loadData as SearchPageLoader } from './SearchPage/SearchPage.duck';
import { loadData as StripePayoutPageLoader } from './StripePayoutPage/StripePayoutPage.duck';
import { loadData as TermsOfServicePageLoader } from './TermsOfServicePage/TermsOfServicePage.duck';
import {
  loadData as TransactionPageLoader,
  setInitialValues as TransactionPageInitialValues,
} from './TransactionPage/TransactionPage.duck';

const getPageDataLoadingAPI = () => {
  return {
    AdminClassesPage: {
      loadData: AdminClassesPageLoader,
    },
    AdminOverviewPage: {
      loadData: AdminOverviewPageLoader,
    },
    AdminTeachersPage: {
      loadData: AdminTeachersPageLoader,
    },
    AdminVenuesPage: {
      loadData: AdminVenuesPageLoader,
    },
    TeacherDashboardPage: {
      loadData: TeacherDashboardPageLoader,
    },
    VenueDashboardPage: {
      loadData: VenueDashboardPageLoader,
    },
    AuthenticationPage: {
      loadData: AuthenticationPageLoader,
    },
    LandingPage: {
      loadData: LandingPageLoader,
    },
    CheckoutPage: {
      setInitialValues: CheckoutPageInitialValues,
    },
    CMSPage: {
      loadData: CMSPageLoader,
    },
    ContactDetailsPage: {
      loadData: ContactDetailsPageLoader,
    },
    EditListingPage: {
      loadData: EditListingPageLoader,
    },
    EmailVerificationPage: {
      loadData: EmailVerificationPageLoader,
    },
    InboxPage: {
      loadData: InboxPageLoader,
    },
    ListingPage: {
      loadData: ListingPageLoader,
    },
    MakeOfferPage: {
      loadData: MakeOfferPageLoader,
    },
    ManageListingsPage: {
      loadData: ManageListingsPageLoader,
    },
    PaymentMethodsPage: {
      loadData: PaymentMethodsPageLoader,
    },
    PrivacyPolicyPage: {
      loadData: PrivacyPolicyPageLoader,
    },
    ProfilePage: {
      loadData: ProfilePageLoader,
    },
    RequestQuotePage: {
      loadData: RequestQuotePageLoader,
    },
    SearchPage: {
      loadData: SearchPageLoader,
    },
    StripePayoutPage: {
      loadData: StripePayoutPageLoader,
    },
    TermsOfServicePage: {
      loadData: TermsOfServicePageLoader,
    },
    TransactionPage: {
      loadData: TransactionPageLoader,
      setInitialValues: TransactionPageInitialValues,
    },
  };
};

export default getPageDataLoadingAPI;
