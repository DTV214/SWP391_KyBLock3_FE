import React, { useState, useEffect } from "react";
import { 
  BarChart2, 
  TrendingUp, 
  PieChart, 
  Package, 
  Users, 
  ShoppingCart, 
  Loader2
} from "lucide-react";
import MonthlyComparisonChart from "../components/MonthlyComparisonChart";
import CategoryPerformanceCharts from "../components/CategoryPerformanceCharts";
import TopTrendingProducts from "../components/TopTrendingProducts";
import TopProductFinancials from "../components/TopProductFinancials";
import VatSegmentChart from "../components/VatSegmentChart";
import ProductAssociationsWidget from "../components/ProductAssociationsWidget";
import { CustomerCareInsights } from "../components/insights/CustomerCareInsights";
import { orderService, type OrderResponse } from "@/feature/checkout/services/orderService";
import adminDashboardService, { 
  type DashboardHighlights, 
  type DashboardSummary 
} from "../services/adminDashboardService";

type TabType = "revenue" | "products" | "categories" | "customers" | "inventory";

const AdminReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("revenue");
  const [insightsData, setInsightsData] = useState<DashboardHighlights | null>(null);
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const [vatOrders, setVatOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [vatLoading, setVatLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summary, insights] = await Promise.all([
          adminDashboardService.getDashboardSummary(),
          adminDashboardService.getDashboardInsights()
        ]);
        setSummaryData(summary);
        setInsightsData(insights);
      } catch (error) {
        console.error("Failed to fetch reports data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const loadVatOrders = async () => {
      try {
        setVatLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        const firstPageData = await orderService.getAllOrders(1, token);
        let allOrdersData = [...firstPageData.data];

        if (firstPageData.totalPages > 1) {
          for (let page = 2; page <= firstPageData.totalPages; page++) {
            const pageData = await orderService.getAllOrders(page, token);
            allOrdersData = [...allOrdersData, ...pageData.data];
          }
        }
        setVatOrders(allOrdersData);
      } catch (err) {
        console.error("Failed to load VAT data:", err);
      } finally {
        setVatLoading(false);
      }
    };
    loadVatOrders();
  }, []);

  const tabs = [
    { id: "revenue", label: "Doanh thu & VAT", icon: TrendingUp },
    { id: "products", label: "Hiệu suất Sản phẩm", icon: Package },
    { id: "categories", label: "Danh mục hàng hóa", icon: PieChart },
    { id: "customers", label: "Chăm sóc khách hàng", icon: Users },
    { id: "inventory", label: "Kết hợp sản phẩm", icon: ShoppingCart },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-tet-primary via-[#8f2d1b] to-tet-accent px-6 py-8 text-white shadow-[0_24px_60px_-38px_rgba(122,22,14,0.6)]">
        <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-serif font-bold mb-2">Báo cáo & Thống kê chi tiết</h1>
          <p className="text-white/90 max-w-2xl text-sm">
            Phân tích chuyên sâu về tình hình kinh doanh, hiệu suất sản phẩm và hành vi khách hàng.
          </p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BarChart2 size={120} />
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-tet-primary text-white shadow-md scale-[1.02]"
                : "text-gray-500 hover:bg-gray-50 hover:text-tet-primary"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px] animate-in fade-in duration-500">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 bg-white rounded-[2rem] border border-gray-100">
            <Loader2 className="animate-spin text-tet-accent" size={48} />
            <p className="text-gray-500 font-medium">Đang chuẩn bị báo cáo...</p>
          </div>
        ) : (
          <>
            {activeTab === "revenue" && (
              <div className="space-y-6">
                <MonthlyComparisonChart />
                {vatLoading ? (
                  <div className="bg-white p-12 rounded-[2rem] border border-gray-100 flex justify-center">
                    <Loader2 className="animate-spin text-gray-300" />
                  </div>
                ) : (
                  <VatSegmentChart orders={vatOrders} subtitlePrefix="Báo cáo thuế VAT toàn diện:" />
                )}
              </div>
            )}

            {activeTab === "products" && (
              <div className="space-y-6">
                <TopTrendingProducts />
                <TopProductFinancials initialProducts={summaryData?.topProducts || []} />
              </div>
            )}

            {activeTab === "categories" && (
              <div className="space-y-6">
                <CategoryPerformanceCharts />
              </div>
            )}

            {activeTab === "customers" && (
              <div className="space-y-6">
                {insightsData && <CustomerCareInsights data={insightsData} />}
              </div>
            )}

            {activeTab === "inventory" && (
              <div className="space-y-6">
                <ProductAssociationsWidget />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
