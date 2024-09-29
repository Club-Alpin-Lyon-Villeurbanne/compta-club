"use client";
import {useCallback, useEffect, useState} from "react";
import {useSession} from "next-auth/react";
import {redirect} from "next/navigation";
import useAxiosAuth from "@/app/lib/hooks/useAxiosAuth";
import {ExpenseReport, Event} from "@/app/interfaces/noteDeFraisInterface";
import {FaCalendarAlt, FaExclamationTriangle, FaInfoCircle, FaMapMarkerAlt, FaSpinner,} from "react-icons/fa";
import dayjs from "dayjs";
import ExpensesList from "@/app/components/note-de-frais/ExpensesTables/ExpensesList";
import Header from "@/app/components/note-de-frais/header";

export default function Home({params}: { params: { slug: string } }) {
    const {data: session, status} = useSession();
    const [event, setEvent] = useState<Event>(null);
    const [ndfs, setNdfs] = useState<ExpenseReport[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const axiosAuth = useAxiosAuth();

    const fetchData = useCallback(async () => {
        try {
            const response = await axiosAuth("/expense-reports?event=" + params.slug);
            const data = response.data;
            data.map(report => report.details = JSON.parse(report.details))
            setEvent(data[0].event);
            setNdfs(data);
        } catch (err) {
            setError("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    }, [axiosAuth, params.slug]);


    useEffect(() => {
        if (session) fetchData();
    }, [fetchData, session]);

    if (status === "loading") {
        return (
            <div className="flex justify-center items-center h-screen">
                <FaSpinner className="animate-spin text-blue-500 w-8 h-8"/>
                <span className="ml-2 text-lg text-gray-700">
          Chargement de la session...
        </span>
            </div>
        );
    }

    if (!session) {
        redirect("/");
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <FaSpinner className="animate-spin text-blue-500 w-8 h-8"/>
                <span className="ml-2 text-lg text-gray-700">
          Chargement de la note de frais...
        </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <FaExclamationTriangle className="text-red-500 w-8 h-8 mb-4"/>
                    <h2 className="text-2xl font-bold text-gray-700">
                        Une erreur est survenue
                    </h2>
                    <p className="text-gray-500 mt-2">{error}</p>
                </div>
            </div>
        );
    }

    if (!ndfs) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <FaExclamationTriangle className="text-orange-500 w-8 h-8 mb-4"/>
                    <h2 className="text-2xl font-bold text-gray-700">
                        Aucun rapport de dépense trouvé
                    </h2>
                    <p className="text-gray-500 mt-2">
                        Vérifiez les informations et réessayez.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <main>
            <div className="container px-4 mx-auto sm:px-8">
                <div className="flex">

                    <Header
                        commission={event.commission.id}
                        titre={event.titre}
                        id={event.id}
                    />

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-6">
                    <div className="bg-white shadow-md rounded-lg p-4 flex items-center">
                        <FaCalendarAlt className="text-blue-500 w-5 h-5 mr-3"/>
                        <div>
                            <p className="text-gray-500">Date de début</p>
                            <p className="font-semibold">
                                {dayjs(event.tsp).format('DD/MM/YYYY à H:mm')}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white shadow-md rounded-lg p-4 flex items-center">
                        <FaCalendarAlt className="text-blue-500 w-5 h-5 mr-3"/>
                        <div>
                            <p className="text-gray-500">Date de fin</p>
                            <p className="font-semibold">
                                {dayjs(event.tspEnd).format('DD/MM/YYYY à H:mm')}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white shadow-md rounded-lg p-4 flex items-center">
                        <FaMapMarkerAlt className="text-blue-500 w-5 h-5 mr-3"/>
                        <div>
                            <p className="text-gray-500">Lieu</p>
                            <p className="font-semibold">{event.rdv}</p>
                        </div>
                    </div>
                </div>


                <ExpensesList expenseReports={ndfs as ExpenseReport[]}/>
            </div>
        </main>
    );
}
